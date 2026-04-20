import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

type Meta = MockPlaygroundConfigType["meta"];

interface FlowInfoModalProps {
    isOpen: boolean;
    meta: Meta;
    onSave: (patch: Partial<Meta>) => void;
    onClose: () => void;
}

const ReadonlyField = ({ label, value }: { label: string; value: string }) => (
    <div>
        <span className="block text-xs font-medium text-gray-400 mb-1 max-w-72">{label}</span>
        <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-mono max-w-md truncate">
            {value}
        </span>
    </div>
);

export const FlowInfoModal = ({ isOpen, meta, onSave, onClose }: FlowInfoModalProps) => {
    const [description, setDescription] = useState(meta.description ?? "");
    const [useCaseId, setUseCaseId] = useState(meta.use_case_id ?? "");
    const [flowName, setFlowName] = useState(meta.flowName ?? "");

    // Sync if meta changes externally (e.g. gist load)
    useEffect(() => {
        setDescription(meta.description ?? "");
        setUseCaseId(meta.use_case_id ?? "");
        setFlowName(meta.flowName ?? "");
    }, [meta]);

    if (!isOpen) return null;

    const handleSave = () => {
        const patch: Partial<Meta> = {};
        if (description.trim() !== (meta.description ?? "")) {
            patch.description = description.trim() || undefined;
        }
        if (useCaseId.trim() !== (meta.use_case_id ?? "")) {
            patch.use_case_id = useCaseId.trim() || undefined;
        }
        if (flowName.trim() !== (meta.flowName ?? "")) {
            patch.flowName = flowName.trim() || undefined;
        }
        onSave(patch);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Flow Info</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Edit optional metadata for this flow
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Read-only identity */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                            Identity (read-only)
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <ReadonlyField label="Domain" value={meta.domain} />
                            <ReadonlyField label="Version" value={meta.version} />
                            <ReadonlyField label="Flow ID" value={meta.flowId} />
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Editable fields */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                            Optional Details
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What does this flow test?"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Use Case ID
                                </label>
                                <input
                                    type="text"
                                    value={useCaseId}
                                    onChange={(e) => setUseCaseId(e.target.value)}
                                    placeholder="e.g. UCS-001"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Flow Name
                                </label>
                                <input
                                    type="text"
                                    value={flowName}
                                    onChange={(e) => setFlowName(e.target.value)}
                                    placeholder="Human-readable name for this flow"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm rounded-xl bg-sky-500 text-white hover:bg-sky-600 font-medium transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
