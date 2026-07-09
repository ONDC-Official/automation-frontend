import { Button } from "@components/Shadcn/Button";
import { ComboBoxControl } from "@components/Shadcn/ComboBox";
import { FieldGroup } from "@components/Shadcn/TextField/field";
import { SessionFormActions } from "@pages/scenario/SessionFormActions";
import { ISavedConfigPanelProps } from "@pages/scenario/types";

export const SavedConfigPanel = ({
    savedConfigKeys,
    selectedSavedConfigKey,
    selectedSavedConfig,
    savedUsecaseId,
    savedConfigUsecaseOptions,
    isSubmitting,
    onConfigKeyChange,
    onUsecaseChange,
    onSubmit,
    onFillManually,
}: ISavedConfigPanelProps) => {
    const hasSavedUsecase = !!selectedSavedConfig?.usecaseId;

    return (
        <div className="space-y-4">
            <FieldGroup>
                <ComboBoxControl
                    label="Select Saved Configuration"
                    placeholder="Select a configuration"
                    value={selectedSavedConfigKey}
                    onValueChange={onConfigKeyChange}
                    options={savedConfigKeys}
                    required
                />

                {selectedSavedConfig && (
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">URL:</span>{" "}
                            {selectedSavedConfig.subscriberUrl}
                        </p>
                        {hasSavedUsecase ? (
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Use Case:</span>{" "}
                                <span className="inline-flex items-center rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-[11px] font-medium text-fuchsia-700">
                                    {selectedSavedConfig.usecaseId}
                                </span>
                            </p>
                        ) : (
                            <ComboBoxControl
                                label="Select Use Case"
                                placeholder="Select a use case"
                                value={savedUsecaseId}
                                onValueChange={onUsecaseChange}
                                options={savedConfigUsecaseOptions}
                                required
                            />
                        )}
                    </div>
                )}
            </FieldGroup>

            <SessionFormActions
                isSubmitting={isSubmitting}
                submitType="button"
                submitDisabled={!selectedSavedConfigKey || !savedUsecaseId}
                onSubmit={onSubmit}
                className="flex items-center gap-3"
                extraActions={
                    <Button variant="link" className="px-0" onClick={onFillManually}>
                        Fill manually instead
                    </Button>
                }
            />
        </div>
    );
};
