import { SwitchField, SwitchFieldGroup } from "@components/Shadcn/Switch";
import {
    DifficultyCache,
    FilteredDifficultyCache,
    FlowSettingsPanelProps,
} from "@pages/scenario/types";
import {
    keyDetailsMapping,
    SESSION_VALIDATION_DEFAULTS,
    skipItems,
} from "@pages/scenario/constants";
import { trackEvent } from "@utils/analytics";

export const buildDifficultyState = (cache: Partial<DifficultyCache>): FilteredDifficultyCache => {
    const merged = { ...SESSION_VALIDATION_DEFAULTS, ...cache };
    const {
        totalDifficulty: _totalDifficulty,
        sensitiveTTL: _sensitiveTTL,
        stopAfterFirstNack: _stopAfterFirstNack,
        timeValidations: _timeValidations,
        ...displayed
    } = merged;
    return displayed;
};

const FlowSettingsPanel: React.FC<FlowSettingsPanelProps> = ({
    autoScrollEnabled,
    onAutoScrollChange,
    experimentalMode,
    onExperimentalModeChange,
    sessionDifficulty,
    onSessionDifficultyChange,
    singleColumn = false,
}: FlowSettingsPanelProps) => (
    <>
        <SwitchFieldGroup
            subtitle="Local · not saved to session"
            layout={singleColumn ? "single" : "default"}
        >
            <SwitchField
                id="auto-scroll"
                label="Auto-scroll"
                info="Auto scroll the page as new api updates in the flow"
                checked={autoScrollEnabled}
                onCheckedChange={onAutoScrollChange}
            />
            <SwitchField
                id="experimental-mode"
                label="Experimental Mode"
                info="Advanced features to do custom testing through playground"
                checked={experimentalMode}
                onCheckedChange={onExperimentalModeChange}
            />
        </SwitchFieldGroup>

        <SwitchFieldGroup
            title="Session validations"
            className="mt-4"
            layout={singleColumn ? "single" : "default"}
        >
            {(Object.entries(sessionDifficulty) as [string, boolean | undefined][])
                .filter(([key]) => !skipItems.includes(key))
                .map(([key, value]) => (
                    <SwitchField
                        key={key}
                        id={`difficulty-${key}`}
                        label={keyDetailsMapping[key]?.label ?? key}
                        info={keyDetailsMapping[key]?.info}
                        checked={!!value}
                        onCheckedChange={(checked) => {
                            trackEvent({
                                category: "SCHEMA_VALIDATION-FLOW_SETTINGS",
                                action: `toggled value: ${key} to: ${checked}`,
                            });
                            onSessionDifficultyChange(key, checked);
                        }}
                    />
                ))}
        </SwitchFieldGroup>
    </>
);

export default FlowSettingsPanel;
