import { FC } from "react";
import Editor from "@monaco-editor/react";

interface EditorSectionProps {
    /** Label shown in the section header bar. */
    title: string;
    /** Decoded JavaScript source to display. */
    decodedCode: string;
}

/**
 * Read-only Monaco JavaScript editor wrapped in a labelled card.
 * Used as the shared base for GenerateSection, RequirementsSection,
 * ValidateSection, and HelperSection.
 */
const EditorSection: FC<EditorSectionProps> = ({ title, decodedCode }) => {
    return (
        <div className="w-full flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {title}
                    </span>
                </div>
                <div className="min-h-[400px]">
                    <Editor
                        height="480px"
                        language="javascript"
                        value={decodedCode}
                        theme="vs-light"
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

export default EditorSection;
