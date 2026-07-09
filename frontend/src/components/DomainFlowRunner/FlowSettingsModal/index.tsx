import { CollapsibleSection } from "@components/DomainFlowRunner/CollapsibleSection";
import { FlowFiltersPanel } from "@components/DomainFlowRunner/FilterFlows";
import FlowSettingsPanel from "@components/DomainFlowRunner/FlowSettingsPanel";
import { FLOW_DIALOG_OVERLAY_CLASS } from "@components/DomainFlowRunner/constants";
import type { IFlowSettingsModalProps } from "@components/DomainFlowRunner/types";
import { Button } from "@components/Shadcn/Button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import LoadingOverlay from "@components/Shadcn/LoadingOverlay";
import { XMarkIcon } from "@heroicons/react/24/outline";

export type { SettingsDraft } from "@components/DomainFlowRunner/types";

export const FlowSettingsModal = ({
    isOpen,
    onClose,
    draft,
    onDraftChange,
    onSave,
    flowTags,
    isSaving,
}: IFlowSettingsModalProps) => {
    if (!draft) return null;

    return (
        <>
            {isSaving && <LoadingOverlay />}
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent
                    showCloseButton={false}
                    overlayClassName={FLOW_DIALOG_OVERLAY_CLASS}
                    className="flex max-h-[90vh] w-full max-w-5xl flex-col gap-0 overflow-hidden rounded-xl border border-n-30 p-0 shadow-lg"
                >
                    <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-n-30 px-6 py-4 dark:border-border-default">
                        <DialogTitle className="text-h5 font-bold">Settings</DialogTitle>
                        <Button
                            type="button"
                            onClick={onClose}
                            aria-label="Close settings"
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-normal transition-colors hover:bg-brand-light-hover dark:bg-brand-dark/30 dark:hover:bg-brand-dark/50"
                        >
                            <XMarkIcon className="size-5" />
                        </Button>
                    </DialogHeader>

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

                    <DialogFooter className="m-0 border-t border-n-30 bg-surface-muted px-6 py-4 dark:border-border-default sm:justify-end">
                        <Button onClick={onSave} isLoading={isSaving} variant="default">
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
