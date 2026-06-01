import ToggleButton from "./mini-components/toggle-button";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { IoInformationCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { putCacheData } from "../../utils/request-utils";
import { useEffect, useState } from "react";
import { trackEvent } from "../../utils/analytics";

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
        "stopAfterFirstNack" | "sensitiveTTL" | "useGateway" | "timeValidations" | "totalDifficulty"
    >
>;

const skipItems = ["stopAfterFirstNack", "sensitiveTTL", "useGateway", "timeValidations"];

interface IProps {
    difficulty_cache: DifficultyCache;
    sessionId: string;
}

const DifficultyCards = ({ difficulty_cache, sessionId }: IProps) => {
    const [difficultyCache, setDifficultCache] = useState<FilteredDifficultyCache>({});
    const [isOpen, setIsOpen] = useState(false);
    const [openInfoKey, setOpenInfoKey] = useState<string | null>(null);

    useEffect(() => {
        const newCache = { ...difficulty_cache };
        if (newCache.totalDifficulty) {
            delete newCache.totalDifficulty;
        }
        if (newCache.sensitiveTTL) delete newCache.sensitiveTTL;
        if (newCache.stopAfterFirstNack) {
            delete newCache.stopAfterFirstNack;
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
        <button className="w-full bg-gray-100 border backdrop-blur-md rounded-md p-4 shadow-sm flex flex-col gap-4 hover:bg-sky-50">
            {/* Header with Button */}
            <div
                className="flex flex-row justify-between items-center cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="text-md font-bold text-sky-700 mt-2 flex gap-2">
                    <div className="w-1 h-5 bg-sky-700 rounded-full"></div>
                    Flow Settings
                </div>

                <IoIosArrowDropdownCircle
                    className={`h-7 w-7 text-sky-700 transform transition-transform duration-300 ${
                        isOpen ? "rotate-180" : "rotate-0"
                    }`}
                />
            </div>

            <div
                className={`transition-all duration-300 ${
                    isOpen
                        ? "max-h-[1000px] opacity-100 overflow-visible"
                        : "max-h-0 opacity-0 overflow-hidden"
                }`}
            >
                {Object.entries(difficultyCache).length !== 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                        {(Object.entries(difficultyCache) as [string, boolean | undefined][])
                            .filter(([key]) => !skipItems.includes(key))
                            .map(([key, value], index: number) => (
                                <div
                                    key={index}
                                    className="flex flex-col bg-white rounded-md shadow p-2 w-full sm:w-auto sm:flex-1"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 relative">
                                            <button
                                                type="button"
                                                className="text-yellow-500 hover:text-yellow-600"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setOpenInfoKey(
                                                        openInfoKey === key ? null : key
                                                    );
                                                }}
                                                aria-label={`Show information for ${
                                                    keyDetailsMapping[key]?.label ?? key
                                                }`}
                                            >
                                                <IoInformationCircleOutline className="h-5 w-5" />
                                            </button>
                                            <span className="text-sm font-bold text-sky-700">
                                                {keyDetailsMapping[key]?.label ?? key}
                                            </span>
                                            {openInfoKey === key && (
                                                <div className="absolute top-7 left-0 z-20 w-64 rounded-md border border-sky-200 bg-sky-700 text-white text-xs font-normal p-2 shadow-lg">
                                                    {keyDetailsMapping[key]?.info ??
                                                        "No information available."}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-800 font-medium ml-2">
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
                                                            return JSON.parse(
                                                                JSON.stringify(prevalue)
                                                            );
                                                        }
                                                    );
                                                }}
                                            />
                                        </span>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </button>
    );
};

export default DifficultyCards;
