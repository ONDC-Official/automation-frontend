import { FC } from "react";
import Editor from "@monaco-editor/react";
import MockRunner from "@ondc/automation-mock-runner";

/** Decode step mock.validate (base64) using same util as protocol-playground. */
export function decodeMockValidate(validate: string | undefined): string | null {
    if (!validate || typeof validate !== "string") return null;
    const trimmed = validate.trim();
    if (!trimmed) return null;
    try {
        return MockRunner.decodeBase64(trimmed);
    } catch {
        return trimmed;
    }
}

interface ValidateSectionProps {
    /** Decoded JavaScript source (from step's mock.validate base64). */
    decodedCode: string;
}

const ValidateSection: FC<ValidateSectionProps> = ({ decodedCode }) => {
    return (
        <div className="w-full flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Validate (JavaScript)
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

export default ValidateSection;
