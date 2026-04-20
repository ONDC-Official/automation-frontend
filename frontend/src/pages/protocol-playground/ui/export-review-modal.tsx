import { useEffect, useRef, useState } from "react";
import { FaTimes, FaSpinner, FaPencilAlt, FaCheck } from "react-icons/fa";
import { TbDatabaseExport } from "react-icons/tb";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

interface ExportReviewModalProps {
    config: MockPlaygroundConfigType | null;
    onConfirm: (overrides: Record<string, string>) => void;
    onCancel: () => void;
    isDownloading?: boolean;
}

interface StepCardProps {
    index: number;
    actionId: string;
    api: string;
    owner?: string;
    description: string;
    onChange: (value: string) => void;
}

const StepCard = ({ index, actionId, api, owner, description, onChange }: StepCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const el = textareaRef.current;
            el.focus();
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
            el.setSelectionRange(el.value.length, el.value.length);
        }
    }, [isEditing]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const el = e.currentTarget;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    };

    const ownerColor =
        owner === "BPP"
            ? "bg-violet-50 text-violet-600 border-violet-100"
            : "bg-sky-50 text-sky-600 border-sky-100";

    return (
        <div
            className={`group bg-white rounded-lg border transition-all duration-150 ${
                isEditing
                    ? "border-sky-300 shadow-md ring-2 ring-sky-100"
                    : "border-gray-200 shadow-sm hover:border-sky-200 hover:shadow"
            }`}
        >
            {/* Metadata row */}
            <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-gray-50">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {index + 1}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-100 shrink-0">
                    {api}
                </span>
                {owner && (
                    <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 ${ownerColor}`}
                    >
                        {owner}
                    </span>
                )}
                <span className="text-[11px] font-mono text-gray-600 truncate flex-1 min-w-0">
                    {actionId}
                </span>
                {isEditing ? (
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsEditing(false);
                        }}
                        className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500 text-white text-[11px] font-medium hover:bg-sky-600 transition-colors"
                    >
                        <FaCheck size={9} />
                        Done
                    </button>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gray-400 hover:text-sky-500 hover:bg-sky-50"
                    >
                        <FaPencilAlt size={11} />
                    </button>
                )}
            </div>

            {/* Description area */}
            <div className="px-4 py-3 cursor-text" onClick={() => !isEditing && setIsEditing(true)}>
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={description}
                        placeholder="Add a description for this step…"
                        onChange={(e) => onChange(e.target.value)}
                        onInput={handleInput}
                        onBlur={() => setIsEditing(false)}
                        className="w-full text-sm text-gray-700 placeholder-gray-300 bg-transparent border-0 outline-none resize-none leading-relaxed min-h-[40px]"
                    />
                ) : description ? (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {description}
                    </p>
                ) : (
                    <p className="text-sm text-gray-300 italic leading-relaxed">
                        Click to add a description…
                    </p>
                )}
            </div>
        </div>
    );
};

export const ExportReviewModal = ({
    config,
    onConfirm,
    onCancel,
    isDownloading = false,
}: ExportReviewModalProps) => {
    const [descriptions, setDescriptions] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!config) return;
        const initial: Record<string, string> = {};
        for (const step of config.steps) {
            initial[step.action_id] = step.description ?? "";
        }
        setDescriptions(initial);
    }, [config]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onCancel]);

    if (!config) return null;

    const stepCount = config.steps.length;
    const filledCount = Object.values(descriptions).filter((d) => d.trim().length > 0).length;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                            <TbDatabaseExport size={18} className="text-sky-600" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-semibold text-gray-900 leading-tight">
                                Review Step Descriptions
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Descriptions are embedded in the deployment YAML as documentation
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes size={13} />
                    </button>
                </div>

                {/* Divider + progress info */}
                <div className="px-6 pb-3 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">
                            {filledCount} of {stepCount} steps have descriptions
                        </span>
                        <span className="text-xs text-gray-400">click any step to edit</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-sky-400 rounded-full transition-all duration-300"
                            style={{
                                width: `${stepCount > 0 ? (filledCount / stepCount) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
                    {config.steps.map((step, index) => (
                        <StepCard
                            key={step.action_id}
                            index={index}
                            actionId={step.action_id}
                            api={step.api}
                            owner={step.owner}
                            description={descriptions[step.action_id] ?? ""}
                            onChange={(value) =>
                                setDescriptions((prev) => ({ ...prev, [step.action_id]: value }))
                            }
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium border border-sky-100">
                        {stepCount} {stepCount === 1 ? "step" : "steps"}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            disabled={isDownloading}
                            className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(descriptions)}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-sky-600 text-white hover:bg-sky-700 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isDownloading ? (
                                <>
                                    <FaSpinner size={12} className="animate-spin" />
                                    Downloading…
                                </>
                            ) : (
                                <>
                                    <TbDatabaseExport size={14} />
                                    Confirm &amp; Download
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
