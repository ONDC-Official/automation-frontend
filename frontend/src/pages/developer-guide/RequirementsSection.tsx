import { FC } from "react";
import Editor from "@monaco-editor/react";
import MockRunner from "@ondc/automation-mock-runner";

/** Decode step mock.requirements (base64) using same util as protocol-playground. */
export function decodeMockRequirements(requirements: string | undefined): string | null {
    if (!requirements || typeof requirements !== "string") return null;
    const trimmed = requirements.trim();
    if (!trimmed) return null;
    try {
        return MockRunner.decodeBase64(trimmed);
    } catch {
        return trimmed;
    }
}

interface RequirementsSectionProps {
    /** Decoded source (from step's mock.requirements base64). */
    decodedCode: string;
}

const RequirementsSection: FC<RequirementsSectionProps> = ({ decodedCode }) => {
    return (
        <div className="w-full flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Requirements (JavaScript)
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

export default RequirementsSection;
