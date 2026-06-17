import { CollapsibleSection } from "@/components/FlowShared/ui/CollapsibleSection";
import { FlowFiltersPanel } from "@/components/FlowShared/filter-flows";
import { FlowSettingsPanel, type FilteredDifficultyCache } from "@/components/ui/difficulty-cards";
import { Button } from "@/components/Shadcn/Button/button";
import { ScreenLoader } from "@/components/Shadcn/ScreenLoader";
import { XMarkIcon } from "@heroicons/react/24/outline";

export type SettingsDraft = {
    autoScrollEnabled: boolean;
    experimentalMode: boolean;
    sessionDifficulty: FilteredDifficultyCache;
    selectedTags: string[];
};

interface IFlowSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    draft: SettingsDraft | null;
    onDraftChange: (draft: SettingsDraft) => void;
    onSave: () => Promise<void>;
    flowTags: string[];
    isSaving: boolean;
}

export const FlowSettingsModal = ({
    isOpen,
    onClose,
    draft,
    onDraftChange,
    onSave,
    flowTags,
    isSaving,
}: IFlowSettingsModalProps) => {
    if (!isOpen || !draft) return null;

    return (
        <>
            {isSaving && <ScreenLoader />}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
                onClick={onClose}
            >
                <div
                    className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface-elevated shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="flow-settings-modal-title"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-n-30 px-6 py-4 dark:border-border-default">
                        <h2
                            id="flow-settings-modal-title"
                            className="text-h5 font-bold text-text-primary"
                        >
                            Settings
                        </h2>
                        <Button
                            type="button"
                            onClick={onClose}
                            aria-label="Close settings"
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-normal transition-colors hover:bg-brand-light-hover dark:bg-brand-dark/30 dark:hover:bg-brand-dark/50"
                        >
                            <XMarkIcon className="size-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <CollapsibleSection
                                title="Flow Settings"
                                defaultOpen
                                className="shadow-none"
                            >
                                <FlowSettingsPanel
                                    autoScrollEnabled={draft.autoScrollEnabled}
                                    onAutoScrollChange={(value) =>
                                        onDraftChange({ ...draft, autoScrollEnabled: value })
                                    }
                                    experimentalMode={draft.experimentalMode}
                                    onExperimentalModeChange={(value) =>
                                        onDraftChange({ ...draft, experimentalMode: value })
                                    }
                                    sessionDifficulty={draft.sessionDifficulty}
                                    onSessionDifficultyChange={(key, value) =>
                                        onDraftChange({
                                            ...draft,
                                            sessionDifficulty: {
                                                ...draft.sessionDifficulty,
                                                [key]: value,
                                            },
                                        })
                                    }
                                    singleColumn
                                />
                            </CollapsibleSection>

                            <CollapsibleSection
                                title="Flow Filters"
                                defaultOpen
                                className="shadow-none"
                            >
                                <FlowFiltersPanel
                                    flowTags={flowTags}
                                    selectedTags={draft.selectedTags}
                                    onSelectedTagsChange={(selectedTags) =>
                                        onDraftChange({ ...draft, selectedTags })
                                    }
                                />
                            </CollapsibleSection>
                        </div>
                    </div>

                    <div className="m-3 flex justify-end border-t border-n-30 bg-surface-muted px-6 py-4 dark:border-border-default">
                        <Button onClick={onSave} isLoading={isSaving} variant="default">
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
