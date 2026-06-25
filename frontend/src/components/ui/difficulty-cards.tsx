import ToggleButton from "./mini-components/toggle-button";
import CustomTooltip from "./mini-components/tooltip";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { IoInformationCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { putCacheData } from "../../utils/request-utils";
import { useEffect, useState, ReactNode } from "react";
import { trackEvent } from "../../utils/analytics";
import { useSession } from "@context/context";

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

interface DifficultyCache {
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

type FilteredDifficultyCache = Partial<
    Omit<
        DifficultyCache,
        "stopAfterFirstNack" | "sensitiveTTL" | "timeValidations" | "totalDifficulty"
    >
>;

const skipItems = ["stopAfterFirstNack", "sensitiveTTL", "timeValidations"];

interface IProps {
    difficulty_cache: DifficultyCache;
    sessionId: string;
}

const DifficultyCards = ({ difficulty_cache, sessionId }: IProps) => {
    const [difficultyCache, setDifficultCache] = useState<FilteredDifficultyCache>({});
    const [isOpen, setIsOpen] = useState(false);
    // Frontend-only UI prefs (persisted in localStorage by the provider, NOT saved to the backend
    // session like the difficulty settings below).
    const { autoScrollEnabled, setAutoScrollEnabled, experimentalMode, setExperimentalMode } =
        useSession();

    useEffect(() => {
        const newCache = { ...difficulty_cache };
        if (newCache.totalDifficulty) {
            delete newCache.totalDifficulty;
        }
        if (newCache.sensitiveTTL) delete newCache.sensitiveTTL;
        if (newCache.stopAfterFirstNack) {
            delete newCache.stopAfterFirstNack;
        }

        if (!("useGateway" in newCache)) {
            newCache.useGateway = true;
        }

        if (!("encryptionValidation" in newCache)) {
            newCache.encryptionValidation = false;
        }
        if (!("useCare" in newCache)) {
            newCache.useCare = false;
        }

        if (!("useTunnelForFIS" in newCache)) {
            newCache.useTunnelForFIS = false;
        }

        setDifficultCache(newCache);
    }, [difficulty_cache]);

    useEffect(() => {
        // const timeout = setTimeout(() => {
        updateDifficulty();
        // }, 1000);

        // return () => clearTimeout(timeout);
    }, [difficultyCache]);

    const updateDifficulty = async () => {
        try {
            await putCacheData({ sessionDifficulty: difficultyCache }, sessionId);
        } catch (e) {
            console.error("error while sending response", e);
            toast.error("Error while updating setting difficulty");
        }
    };
    return (
        <div className="w-full rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-sm">
            {/* Header / disclosure toggle */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between rounded-md text-left transition-colors hover:opacity-90"
            >
                <span className="flex items-center gap-2 text-base font-bold text-sky-700">
                    <span className="h-5 w-1 rounded-full bg-sky-700"></span>
                    Flow Settings
                </span>
                <IoIosArrowDropdownCircle
                    className={`h-7 w-7 shrink-0 text-sky-700 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : "rotate-0"
                    }`}
                />
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "mt-4 max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                {/* Frontend-only UI prefs — local to this browser, not saved to the session. */}
                <section>
                    <h4 className="mb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Local · not saved to session
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        <SettingRow
                            label="Auto-scroll"
                            info="Auto scroll the page as new api updates in the flow"
                        >
                            <ToggleButton
                                initialValue={autoScrollEnabled ?? true}
                                onToggle={(value: boolean) => setAutoScrollEnabled?.(value)}
                            />
                        </SettingRow>
                        <SettingRow
                            label="Experimental Mode"
                            info="Advanced features to do custom testing through playground"
                        >
                            <ToggleButton
                                initialValue={experimentalMode ?? false}
                                onToggle={(value: boolean) => setExperimentalMode?.(value)}
                            />
                        </SettingRow>
                    </div>
                </section>

                {Object.entries(difficultyCache).length !== 0 && (
                    <section className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="mb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Session validations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {(Object.entries(difficultyCache) as [string, boolean | undefined][])
                                .filter(([key]) => !skipItems.includes(key))
                                .map(([key, value]) => (
                                    <SettingRow
                                        key={key}
                                        label={keyDetailsMapping[key]?.label ?? key}
                                        info={keyDetailsMapping[key]?.info}
                                    >
                                        <ToggleButton
                                            initialValue={value}
                                            onToggle={(value: boolean) => {
                                                trackEvent({
                                                    category: "SCHEMA_VALIDATION-FLOW_SETTINGS",
                                                    action: `toggled value: ${key} to: ${value}`,
                                                });
                                                setDifficultCache(
                                                    (prevalue: FilteredDifficultyCache) => {
                                                        prevalue[
                                                            key as keyof FilteredDifficultyCache
                                                        ] = value;
                                                        return JSON.parse(JSON.stringify(prevalue));
                                                    }
                                                );
                                            }}
                                        />
                                    </SettingRow>
                                ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

// Compact label + toggle chip that sizes to its content (so simple toggles stay small and wrap).
// When `info` is given, an info icon shows the description in a Tippy tooltip on hover/focus.
function SettingRow({
    label,
    children,
    info,
}: {
    label: string;
    children: ReactNode;
    info?: string;
}) {
    return (
        <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm">
            <span className="whitespace-nowrap text-sm font-medium text-sky-700">{label}</span>

            <span className="shrink-0">{children}</span>
            {info && (
                <CustomTooltip content={info}>
                    <span
                        tabIndex={0}
                        aria-label={`Info: ${label}`}
                        className="shrink-0 cursor-help text-gray-400 transition-colors hover:text-sky-600"
                    >
                        <IoInformationCircleOutline className="h-4 w-4" />
                    </span>
                </CustomTooltip>
            )}
        </div>
    );
}

export default DifficultyCards;
