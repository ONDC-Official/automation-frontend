import { useEffect, useMemo, useState } from "react";
import type { Monaco } from "@monaco-editor/react";
import { compileUserCodeV2, extractHelperDeclarationsV2 } from "@ondc/automation-mock-runner";

import { useSettledValue } from "@pages/protocol-studio/hooks/use-settled-value";
import {
    createMonacoTranspiler,
    emitDeclarations,
} from "@pages/protocol-studio/ui/editor/inspector/typescript-setup";

/** The helpers' Monaco model: the popup's editor opens this same model. */
export const HELPERS_PATH = "studio://config/helpers.ts";

/** How long helpers.ts editing pauses before it is recompiled. */
const COMPILE_DELAY_MS = 600;

export interface CompiledHelpers {
    /** The last JavaScript that compiled cleanly: what `helperLib` holds. Null until one has. */
    js: string | null;
    /** The helpers' top-level names, for the "helpers only reach generate" warning. */
    names: string[];
    /**
     * The declarations TypeScript emits for helpers.ts (real, inferred signatures).
     * Step files get these as an extra lib: Monaco checks each file with only
     * the extra libs beside it, never with the other open models.
     */
    dts: string;
    /** Whether the current source compiles (false while it has errors; `js` is then the last good one). */
    ok: boolean;
    /**
     * The current source hasn't compiled yet: typing hasn't settled, or the compile is
     * in flight. A run started now would go stale the moment `js` lands, so it waits.
     */
    compiling: boolean;
}

/**
 * helpers.ts as TypeScript. Its model is created up front and kept in sync with
 * `source`, so it compiles before the popup is ever opened. Once typing pauses
 * it is compiled to the JavaScript `helperLib` carries (prepended to every
 * generate at runtime) and to declarations, which give step files the helpers'
 * real signatures.
 */
export const useHelpersTypeScript = (monaco: Monaco | null, source: string): CompiledHelpers => {
    const [compiled, setCompiled] = useState<Omit<CompiledHelpers, "compiling">>({
        js: null,
        names: [],
        dts: "",
        ok: true,
    });
    // The settled source the last compile (good or not) was for.
    const [compiledSource, setCompiledSource] = useState<string | null>(null);

    // The model exists, and holds `source`, whether or not an editor shows it.
    useEffect(() => {
        if (!monaco) return;
        const uri = monaco.Uri.parse(HELPERS_PATH);
        const model = monaco.editor.getModel(uri);
        if (!model) monaco.editor.createModel(source, "typescript", uri);
        // Typing in the popup edits the model first, so this only catches outside changes.
        else if (model.getValue() !== source) model.setValue(source);
    }, [monaco, source]);

    const settled = useSettledValue(source, COMPILE_DELAY_MS);
    useEffect(() => {
        if (!monaco) return;
        const model = monaco.editor.getModel(monaco.Uri.parse(HELPERS_PATH));
        const transpiler = model ? createMonacoTranspiler(monaco, model) : null;
        if (!model || !transpiler) {
            // Nothing will compile it: don't hold runs back waiting for it.
            setCompiledSource(settled);
            return;
        }
        let stale = false;
        (async () => {
            const [result, dts] = await Promise.all([
                compileUserCodeV2(settled, "helpers", { transpiler, fileName: HELPERS_PATH }),
                emitDeclarations(monaco, model),
            ]);
            if (stale) return;
            setCompiledSource(settled);
            setCompiled((prev) =>
                result.ok && result.js
                    ? {
                          js: result.js,
                          names: extractHelperDeclarationsV2(result.js).names,
                          dts,
                          ok: true,
                      }
                    : { ...prev, dts: dts || prev.dts, ok: false }
            );
        })().catch(() => {
            if (stale) return;
            setCompiledSource(settled);
            setCompiled((prev) => ({ ...prev, ok: false }));
        });
        return () => {
            stale = true;
        };
    }, [monaco, settled]);

    const compiling = monaco !== null && (settled !== source || compiledSource !== settled);
    return useMemo(() => ({ ...compiled, compiling }), [compiled, compiling]);
};

export default useHelpersTypeScript;
