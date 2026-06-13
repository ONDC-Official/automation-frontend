import { Button } from "@/components/shadcn/button";
import { FieldGroup } from "@/components/shadcn/field";
import { NATIVE_SELECT_CLASS } from "@/pages/scenario/helpers";
import { SessionFormActions } from "@/pages/scenario/SessionFormActions";
import { ISavedConfigPanelProps } from "@/pages/scenario/types";

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
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold">
                        Select Saved Configuration
                        <span className="text-destructive">*</span>
                    </label>
                    <select
                        className={NATIVE_SELECT_CLASS}
                        value={selectedSavedConfigKey}
                        onChange={(e) => onConfigKeyChange(e.target.value)}
                    >
                        <option value="" disabled>
                            Select a configuration
                        </option>
                        {savedConfigKeys.map((key) => (
                            <option key={key} value={key}>
                                {key}
                            </option>
                        ))}
                    </select>
                </div>

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
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold">
                                    Select Use Case
                                    <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className={NATIVE_SELECT_CLASS}
                                    value={savedUsecaseId}
                                    onChange={(e) => onUsecaseChange(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Select a use case
                                    </option>
                                    {savedConfigUsecaseOptions.map((uc) => (
                                        <option key={uc} value={uc}>
                                            {uc}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                    <Button type="button" variant="link" className="px-0" onClick={onFillManually}>
                        Fill manually instead
                    </Button>
                }
            />
        </div>
    );
};
