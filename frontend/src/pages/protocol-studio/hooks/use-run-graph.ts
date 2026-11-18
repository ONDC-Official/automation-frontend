import { useEffect, useMemo, useRef, useState } from "react";
import type { Monaco } from "@monaco-editor/react";
import {
    compileUserCodeV2,
    GraphExecutorV2,
    MockRunnerV2,
    type CompiledUserCodeV2,
    type GraphEdgeV2,
    type GraphNodeV2,
    type MockPlaygroundConfigV2Type,
    type ProtocolGraphV2,
    type UserCodeKindV2,
    type UserCodeTranspilerV2,
} from "@ondc/automation-mock-runner";

import { useSettledValue } from "@pages/protocol-studio/hooks/use-settled-value";
import { createMonacoFileTranspiler } from "@pages/protocol-studio/ui/editor/inspector/typescript-setup";
import type {
    ActionFileId,
    FlatGraph,
    ProtocolProblem,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/** How long edits settle before the graph is recompiled for running. */
const COMPILE_DELAY_MS = 800;

/** The step files that compile to runnable JavaScript, and the kind each compiles as. */
const CODE_FILES: {
    file: ActionFileId;
    kind: UserCodeKindV2;
    code: keyof NonNullable<GraphNodeV2["code"]>;
}[] = [
    { file: "generate", kind: "generate", code: "generate" },
    { file: "validate", kind: "validate", code: "validate" },
    { file: "match", kind: "match", code: "match" },
    { file: "exit", kind: "exit", code: "exit" },
    { file: "requirements", kind: "meetsRequirements", code: "requirements" },
];

/** JavaScript nodes (imported published flows) need no transpiling. */
const IDENTITY: UserCodeTranspilerV2 = {
    name: "javascript",
    version: "-",
    transpile: (source) => ({ js: source }),
};

export interface RunGraph {
    /** The graph as the executor runs it, or null while it doesn't compile. */
    graph: ProtocolGraphV2 | null;
    executor: GraphExecutorV2 | null;
    /** Compile errors, as problems; any error means no executor. */
    problems: ProtocolProblem[];
    compiling: boolean;
}

interface Compiled {
    graph: ProtocolGraphV2 | null;
    problems: ProtocolProblem[];
}

const problem = (
    nodeId: string,
    message: string,
    level: ProtocolProblem["level"] = "error"
): ProtocolProblem => ({
    id: `run:${nodeId}:${message}`,
    level,
    message,
    nodeId,
});

const parseJson = (source: string, fallback: unknown) => {
    if (source.trim() === "") return fallback;
    return JSON.parse(source) as unknown;
};

/**
 * Compiles the flat protocol graph into what `GraphExecutorV2` runs: every
 * node's TypeScript step files (and a decision's `decide`) to base64 JavaScript,
 * its JSON files parsed, groups already resolved by `flattenGraph`. Compiles
 * are cached by source, so re-running after an edit recompiles one file, not
 * the graph. A node that doesn't compile is a problem and blocks running.
 */
export const useRunGraph = (
    monaco: Monaco | null,
    flat: FlatGraph,
    config: MockPlaygroundConfigV2Type,
    helpers: { js: string | null; ok: boolean }
): RunGraph => {
    const settledFlat = useSettledValue(flat, COMPILE_DELAY_MS);
    const cache = useRef(new Map<string, CompiledUserCodeV2>());
    const [compiled, setCompiled] = useState<Compiled>({ graph: null, problems: [] });
    const [compiling, setCompiling] = useState(false);

    useEffect(() => {
        if (!monaco) return;
        const tsTranspiler = createMonacoFileTranspiler(monaco);
        let stale = false;
        setCompiling(true);
        (async () => {
            const problems: ProtocolProblem[] = [];
            const nodes: GraphNodeV2[] = [];

            const compileFile = async (
                node: StudioNode,
                label: string,
                source: string,
                kind: UserCodeKindV2
            ): Promise<string | undefined> => {
                const typescript = (node.codeLanguage ?? "typescript") === "typescript";
                const key = `${typescript ? "ts" : "js"}\n${kind}\n${source}`;
                let result = cache.current.get(key);
                if (!result) {
                    const transpiler = typescript ? tsTranspiler : IDENTITY;
                    if (!transpiler) {
                        problems.push(
                            problem(node.id, `${label}: TypeScript isn't available to compile it`)
                        );
                        return undefined;
                    }
                    result = await compileUserCodeV2(source, kind, {
                        transpiler,
                        fileName: `studio://run/${encodeURIComponent(node.id)}/${label}.${typescript ? "ts" : "js"}`,
                    });
                    cache.current.set(key, result);
                }
                if (!result.ok || !result.jsBase64) {
                    const first = result.errors[0];
                    problems.push(
                        problem(
                            node.id,
                            `${label}${first?.line ? `:${first.line}` : ""}: ${first?.message ?? "doesn't compile"}`
                        )
                    );
                    return undefined;
                }
                return result.jsBase64;
            };

            for (const node of settledFlat.nodes) {
                if (node.group) continue;
                if (node.decision) {
                    // decide is TypeScript like the step files, but compiles as a bare function.
                    const decide = await compileFile(
                        { ...node, codeLanguage: "typescript" },
                        "decide",
                        node.decision.decide,
                        "helpers"
                    );
                    nodes.push({
                        id: node.id,
                        api: "decision",
                        owner: node.owner,
                        kind: "decision",
                        responseFor: null,
                        cases: node.decision.cases,
                        ...(node.start ? { start: true } : {}),
                        ...(node.end ? { end: true } : {}),
                        ...(decide ? { code: { decide } } : {}),
                    });
                    continue;
                }
                const code: NonNullable<GraphNodeV2["code"]> = {};
                for (const { file, kind, code: slot } of CODE_FILES) {
                    // A missing file (older drafts) or an empty match means "no function".
                    const source = node.files[file] ?? "";
                    if (file === "match" && source.trim() === "") continue;
                    // exit only runs on a repeat-until node; lint flags one without it.
                    if (file === "exit" && (!node.repeat?.until || source.trim() === "")) continue;
                    const js = await compileFile(node, file, source, kind);
                    if (js) code[slot] = js;
                }
                let defaultPayload: unknown = {};
                let inputs: GraphNodeV2["inputs"];
                try {
                    defaultPayload = parseJson(node.files.defaultPayload, {});
                } catch (e) {
                    problems.push(problem(node.id, `defaultPayload.json: ${(e as Error).message}`));
                }
                try {
                    const parsed = parseJson(node.files.inputs, {});
                    inputs =
                        parsed && typeof parsed === "object"
                            ? (parsed as GraphNodeV2["inputs"])
                            : undefined;
                } catch (e) {
                    problems.push(problem(node.id, `inputs.json: ${(e as Error).message}`));
                }
                nodes.push({
                    id: node.id,
                    api: node.api,
                    owner: node.owner,
                    kind: node.kind === "group" || node.kind === "decision" ? "request" : node.kind,
                    responseFor: node.responseFor,
                    description: node.description,
                    code,
                    defaultPayload,
                    ...(inputs && Object.keys(inputs).length ? { inputs } : {}),
                    saveData: node.saveData ?? {},
                    ...(node.formHtml
                        ? { formHtml: MockRunnerV2.encodeBase64(node.formHtml) }
                        : {}),
                    ...(node.optional ? { optional: true } : {}),
                    ...(node.manual ? { manual: true } : {}),
                    ...(node.repeat ? { repeat: node.repeat } : {}),
                    ...(node.start ? { start: true } : {}),
                    ...(node.end ? { end: true } : {}),
                });
            }
            const edges: GraphEdgeV2[] = settledFlat.edges.map((edge) => ({
                id: edge.id,
                from: edge.from,
                to: edge.to,
                kind: edge.kind,
                ...(edge.case !== undefined ? { case: edge.case } : {}),
                ...(edge.label ? { label: edge.label } : {}),
            }));
            if (stale) return;
            const hasErrors = problems.some((p) => p.level === "error");
            setCompiled({ graph: hasErrors ? null : { nodes, edges }, problems });
            setCompiling(false);
        })().catch((e: unknown) => {
            if (stale) return;
            setCompiled({
                graph: null,
                problems: [
                    problem(
                        "",
                        `Couldn't compile the graph: ${e instanceof Error ? e.message : String(e)}`
                    ),
                ],
            });
            setCompiling(false);
        });
        return () => {
            stale = true;
        };
    }, [monaco, settledFlat]);

    const helperLib =
        helpers.js !== null ? MockRunnerV2.encodeBase64(helpers.js) : config.helperLib;
    const executor = useMemo(
        () =>
            compiled.graph
                ? new GraphExecutorV2(compiled.graph, {
                      domain: config.meta.domain,
                      version: config.meta.version,
                      transactionData: config.transaction_data,
                      helperLib,
                      externalSessionData: config.transaction_data.external_session_data,
                  })
                : null,
        [
            compiled.graph,
            config.meta.domain,
            config.meta.version,
            config.transaction_data,
            helperLib,
        ]
    );

    const problems = useMemo(
        () =>
            helpers.ok
                ? compiled.problems
                : [
                      ...compiled.problems,
                      problem("", "helpers.ts doesn't compile: generate can't run"),
                  ],
        [compiled.problems, helpers.ok]
    );

    return { graph: compiled.graph, executor: helpers.ok ? executor : null, problems, compiling };
};

export default useRunGraph;
