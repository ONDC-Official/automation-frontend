import { FC, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { decodeBase64 } from "./utils";
import type { editor } from "monaco-editor";

/** Build a map of function name -> full definition source for hover. */
function getFunctionDefinitions(code: string): Map<string, string> {
    const map = new Map<string, string>();
    try {
        const ast = acorn.parse(code, { ecmaVersion: 2020 });
        walk.simple(ast, {
            FunctionDeclaration(node) {
                if (node.id?.name) map.set(node.id.name, code.slice(node.start, node.end));
            },
            VariableDeclarator(node) {
                const init = node.init as acorn.Node | undefined;
                if (
                    node.id.type === "Identifier" &&
                    init &&
                    (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression")
                ) {
                    map.set(node.id.name, code.slice(init.start, init.end));
                }
            },
        });
    } catch {
        // Invalid or unsupported syntax; no hover definitions
    }
    return map;
}

/** Decode flow helperLib (base64). */
export function decodeHelperLib(helperLib: string | undefined): string | null {
    return decodeBase64(helperLib);
}

interface HelperSectionProps {
    /** Decoded JavaScript source (from flow's base64 helperLib). */
    decodedCode: string;
}

const HelperSection: FC<HelperSectionProps> = ({ decodedCode }) => {
    const hoverDisposableRef = useRef<{ dispose: () => void } | null>(null);
    const functionDefsRef = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        functionDefsRef.current = getFunctionDefinitions(decodedCode);
    }, [decodedCode]);

    useEffect(() => {
        return () => {
            hoverDisposableRef.current?.dispose();
            hoverDisposableRef.current = null;
        };
    }, []);

    const handleEditorMount: OnMount = (editorInstance, monaco) => {
        hoverDisposableRef.current?.dispose();
        hoverDisposableRef.current = null;

        const modelUri = editorInstance.getModel()?.uri.toString();
        if (!modelUri || !monaco.languages.registerHoverProvider) return;

        const disposable = monaco.languages.registerHoverProvider("javascript", {
            provideHover: (
                model: editor.ITextModel,
                position: { lineNumber: number; column: number }
            ) => {
                if (model.uri?.toString() !== modelUri) return null;

                const word = model.getWordAtPosition(position);
                if (!word) return null;

                const definition = functionDefsRef.current.get(word.word);
                if (!definition) return null;

                return {
                    range: new monaco.Range(
                        position.lineNumber,
                        word.startColumn,
                        position.lineNumber,
                        word.endColumn
                    ),
                    contents: [{ value: "```javascript\n" + definition + "\n```" }],
                };
            },
        });

        hoverDisposableRef.current = disposable;
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Helper functions (JavaScript)
                    </span>
                </div>
                <div className="min-h-[400px]">
                    <Editor
                        height="480px"
                        language="javascript"
                        value={decodedCode}
                        theme="vs-light"
                        onMount={handleEditorMount}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            padding: { top: 12 },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default HelperSection;
