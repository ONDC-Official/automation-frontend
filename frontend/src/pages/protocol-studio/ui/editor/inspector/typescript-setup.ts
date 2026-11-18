import type { Monaco } from "@monaco-editor/react";
import type { CodeIssueV2, UserCodeTranspilerV2 } from "@ondc/automation-mock-runner";
import type { editor, Uri } from "monaco-editor";

/** Monaco's TypeScript API: top-level since 0.55, under `languages` before. */
const getTypeScript = (monaco: Monaco): Monaco["typescript"] | undefined =>
    monaco.typescript ??
    (monaco.languages as unknown as { typescript?: Monaco["typescript"] }).typescript;

/**
 * Global-script diagnostics to ignore. Every step file declares a top-level
 * `function generate` (the sandbox needs it), and all open files share one
 * TypeScript program, so these would flag every node but the first.
 */
const IGNORED_DIAGNOSTICS = [
    2300, // Duplicate identifier
    2384, // Overload signatures must all be ambient or non-ambient
    2393, // Duplicate function implementation
    2394, // This overload signature is not compatible with its implementation
    2451, // Cannot redeclare block-scoped variable
];

const configured = new WeakSet<object>();

/**
 * Points Monaco's TypeScript service at step code: ES2020 global scripts with
 * no DOM (the sandbox has none). Loose by default: example-inferred specs make
 * nearly every field optional, so strict null checks would flag every access.
 * Leaves `javascriptDefaults` alone, so the v1 playground's editors are unaffected.
 */
export const configureStudioTypeScript = (monaco: Monaco) => {
    const ts = getTypeScript(monaco);
    if (!ts || configured.has(monaco)) return;
    configured.add(monaco);
    ts.typescriptDefaults.setCompilerOptions({
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        lib: ["es2020"],
        allowJs: true,
        checkJs: false,
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        alwaysStrict: false,
        sourceMap: true,
        removeComments: false,
        allowNonTsExtensions: true,
        skipLibCheck: true,
    });
    ts.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        diagnosticCodesToIgnore: IGNORED_DIAGNOSTICS,
    });
};

/** Replaces the declaration files every step file sees (spec types, session, sandbox, helpers). */
export const setStudioTypeLibs = (monaco: Monaco, libs: Record<string, string>) => {
    getTypeScript(monaco)?.typescriptDefaults.setExtraLibs(
        Object.entries(libs).map(([name, content]) => ({
            filePath: `file:///studio-types/${name}`,
            content,
        }))
    );
};

type MessageChain = string | { messageText: string; next?: MessageChain[] };

const flatten = (message: MessageChain): string =>
    typeof message === "string"
        ? message
        : [message.messageText, ...(message.next ?? []).map(flatten)].join(" ");

/**
 * Compiles an open model with Monaco's own TypeScript worker: the same
 * compiler that type-checks the editor, with no extra download. The model's
 * text is what gets compiled (`source` is ignored), so it must be in sync.
 */
export const createMonacoTranspiler = (
    monaco: Monaco,
    model: editor.ITextModel
): UserCodeTranspilerV2 | null => {
    const ts = getTypeScript(monaco);
    if (!ts) return null;
    return {
        name: "typescript",
        version: ts.typescriptVersion,
        async transpile() {
            const uri: Uri = model.uri;
            const worker = await (await ts.getTypeScriptWorker())(uri);
            const fileName = uri.toString();
            const [syntax, emit] = await Promise.all([
                worker.getSyntacticDiagnostics(fileName),
                worker.getEmitOutput(fileName),
            ]);
            const files: Array<{ name: string; text: string }> = emit.outputFiles ?? [];
            const diagnostics: Array<{ messageText: unknown; start?: number }> = syntax;
            return {
                js: files.find((file) => !file.name.endsWith(".map"))?.text ?? "",
                sourceMap: files.find((file) => file.name.endsWith(".map"))?.text,
                diagnostics: diagnostics.map((d) => ({
                    message: flatten(d.messageText as MessageChain),
                    line:
                        d.start === undefined ? undefined : model.getPositionAt(d.start).lineNumber,
                })),
            };
        },
    };
};

/**
 * A transpiler for files that have no editor open: each call puts the source
 * in a throwaway model at `fileName` (so the TypeScript worker sees the same
 * extra libs step files are checked with), emits, and disposes it. A model
 * that already exists at that uri (an open tab) is used as it is.
 */
export const createMonacoFileTranspiler = (monaco: Monaco): UserCodeTranspilerV2 | null => {
    const ts = getTypeScript(monaco);
    if (!ts) return null;
    return {
        name: "typescript",
        version: ts.typescriptVersion,
        async transpile(source, fileName) {
            const uri = monaco.Uri.parse(fileName);
            const existing = monaco.editor.getModel(uri);
            const model = existing ?? monaco.editor.createModel(source, "typescript", uri);
            try {
                if (existing && existing.getValue() !== source) existing.setValue(source);
                const inner = createMonacoTranspiler(monaco, model);
                if (!inner) throw new Error("TypeScript isn't available");
                return await inner.transpile(source, fileName);
            } finally {
                if (!existing) model.dispose();
            }
        },
    };
};

/** Owner of the markers the compile step puts on a model. */
export const SANDBOX_MARKER_OWNER = "ondc-sandbox";

/** Shows compile errors / warnings on their lines (a whole-line squiggle). */
export const setSandboxMarkers = (
    monaco: Monaco,
    model: editor.ITextModel,
    errors: CodeIssueV2[],
    warnings: CodeIssueV2[]
) => {
    const toMarker = (issue: CodeIssueV2, severity: number): editor.IMarkerData => {
        const line = Math.min(Math.max(issue.line ?? 1, 1), model.getLineCount());
        return {
            severity,
            message: issue.message,
            source: "sandbox",
            startLineNumber: line,
            startColumn: model.getLineFirstNonWhitespaceColumn(line) || 1,
            endLineNumber: line,
            endColumn: model.getLineMaxColumn(line),
        };
    };
    monaco.editor.setModelMarkers(model, SANDBOX_MARKER_OWNER, [
        ...errors.map((issue) => toMarker(issue, monaco.MarkerSeverity.Error)),
        ...warnings.map((issue) => toMarker(issue, monaco.MarkerSeverity.Warning)),
    ]);
};

/**
 * TypeScript highlighting for declarations shown read-only (the types popup).
 * Not the `typescript` language: models in it join the program step code is
 * checked in, and these declarations are already there as extra libs, so
 * every one would be declared twice. This reuses TypeScript's tokenizer only.
 */
export const TYPES_VIEW_LANGUAGE = "studio-dts";

export const registerTypesViewLanguage = (monaco: Monaco) => {
    const { languages } = monaco;
    // Monaco's built-in language entries also carry a `loader` for their tokenizer.
    const registered: Array<{
        id: string;
        loader?: () => Promise<{ language: unknown; conf: unknown }>;
    }> = languages.getLanguages();
    if (registered.some(({ id }) => id === TYPES_VIEW_LANGUAGE)) return;
    languages.register({ id: TYPES_VIEW_LANGUAGE, aliases: ["TypeScript declarations"] });
    const typescript = registered.find(({ id }) => id === "typescript");
    void typescript
        ?.loader?.()
        .then(({ language, conf }) => {
            languages.setMonarchTokensProvider(
                TYPES_VIEW_LANGUAGE,
                language as Parameters<typeof languages.setMonarchTokensProvider>[1]
            );
            languages.setLanguageConfiguration(
                TYPES_VIEW_LANGUAGE,
                conf as Parameters<typeof languages.setLanguageConfiguration>[1]
            );
        })
        // Without the tokenizer the declarations still show, as plain text.
        .catch(() => {});
};

/** The declarations TypeScript emits for a model, e.g. helpers.ts's signatures. */
export const emitDeclarations = async (
    monaco: Monaco,
    model: editor.ITextModel
): Promise<string> => {
    const ts = getTypeScript(monaco);
    if (!ts) return "";
    const worker = await (await ts.getTypeScriptWorker())(model.uri);
    const output = await worker.getEmitOutput(model.uri.toString(), true, true);
    const files: Array<{ name: string; text: string }> = output.outputFiles ?? [];
    return files.find((file) => file.name.endsWith(".d.ts"))?.text ?? "";
};
