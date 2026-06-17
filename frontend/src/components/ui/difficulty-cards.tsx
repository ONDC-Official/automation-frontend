import { SwitchField, SwitchFieldGroup } from "@/components/Shadcn/Switch";
import { trackEvent } from "@utils/analytics";

const keyDetailsMapping: Record<string, { label: string; info: string }> = {
    stopAfterFirstNack: {
        label: "Stop At Nack",
        info: "Stops execution after the first NACK response is received.",
    },
    timeValidations: {
        label: "Time Validation",
        info: "Checks whether request and response timestamps are valid.",
    },
    protocolValidations: {
        label: "Protocol Validation",
        info: "Validates payloads against protocol-level schema and rules.",
    },
    useGateway: {
        label: "Use Gateway",
        info: "Routes requests through gateway before reaching target participants.",
    },
    headerValidaton: {
        label: "Header Validation",
        info: "Verifies required request headers and their expected values.",
    },
    useGzip: {
        label: "Use Gzip",
        info: "Enables gzip compression for payload transfer.",
    },
    encryptionValidation: {
        label: "Encryption Validation",
        info: "Validates encryption-related fields and expected encrypted values.",
    },
    useCare: {
        label: "Use Care(IGM)",
        info: "Enables IGM care flow specific checks for supported scenarios.",
    },
    useTunnelForFIS: {
        label: "Use Tunnel(FIS)",
        info: "Uses the FIS tunnel path for request/response execution.",
    },
    totalDifficulty: {
        label: "Total Difficulty",
        info: "Represents combined score based on enabled difficulty settings.",
    },
};

export interface DifficultyCache {
    stopAfterFirstNack?: boolean;
    timeValidations: boolean;
    protocolValidations: boolean;
    useGateway: boolean;
    headerValidaton: boolean;
    sensitiveTTL?: boolean;
    useGzip: boolean;
    encryptionValidation?: boolean;
    useCare?: boolean;
    useTunnelForFIS?: boolean;
    totalDifficulty?: number;
}

export type FilteredDifficultyCache = Partial<
    Omit<
        DifficultyCache,
        "stopAfterFirstNack" | "sensitiveTTL" | "useGateway" | "timeValidations" | "totalDifficulty"
    >
>;

const skipItems = ["stopAfterFirstNack", "sensitiveTTL", "useGateway", "timeValidations"];

export const SESSION_VALIDATION_DEFAULTS: FilteredDifficultyCache = {
    protocolValidations: true,
    headerValidaton: true,
    useGzip: false,
    encryptionValidation: false,
    useCare: false,
    useTunnelForFIS: false,
};

export function buildDifficultyState(cache: Partial<DifficultyCache>): FilteredDifficultyCache {
    const merged = { ...SESSION_VALIDATION_DEFAULTS, ...cache };
    const {
        totalDifficulty: _totalDifficulty,
        sensitiveTTL: _sensitiveTTL,
        stopAfterFirstNack: _stopAfterFirstNack,
        useGateway: _useGateway,
        timeValidations: _timeValidations,
        ...displayed
    } = merged;
    return displayed;
}

interface FlowSettingsPanelProps {
    autoScrollEnabled: boolean;
    onAutoScrollChange: (value: boolean) => void;
    experimentalMode: boolean;
    onExperimentalModeChange: (value: boolean) => void;
    sessionDifficulty: FilteredDifficultyCache;
    onSessionDifficultyChange: (key: string, value: boolean) => void;
    singleColumn?: boolean;
}

export const FlowSettingsPanel = ({
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
