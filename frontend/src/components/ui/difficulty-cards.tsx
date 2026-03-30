import ToggleButton from "./mini-components/toggle-button";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { toast } from "react-toastify";
import { putCacheData } from "../../utils/request-utils";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "../../utils/analytics";

const keyMapping: Record<string, string> = {
    stopAfterFirstNack: "Stop At Nack",
    timeValidations: "Time Validation",
    protocolValidations: "Protocol Validation",
    useGateway: "Use Gateway",
    headerValidaton: "Header Validation",
    useGzip: "Use Gzip",
    encryptionEnabled: "Encryption Validation",
    totalDifficulty: "Total Difficulty",
};

interface DifficultyCache {
    stopAfterFirstNack?: boolean;
    timeValidations: boolean;
    protocolValidations: boolean;
    useGateway: boolean;
    headerValidaton: boolean;
    sensitiveTTL?: boolean;
    useGzip: boolean;
    encryptionEnabled?: boolean;
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
    domain?: string;
    usecaseId?: string;
    version?: string;
}

const DifficultyCards = ({ difficulty_cache, sessionId, domain, usecaseId, version }: IProps) => {
    const [difficultyCache, setDifficultCache] = useState<FilteredDifficultyCache>({});
    const [isOpen, setIsOpen] = useState(false);

    const isEncryptionAllowed = useMemo(() => {
        const normalizedDomain = domain?.trim().toUpperCase() || "";
        const normalizedUseCase = usecaseId?.trim().toUpperCase() || "";
        const normalizedVersion = version?.trim() || "";

        return (
            (normalizedDomain === "FIS13" || normalizedDomain === "ONDC:FIS13") &&
            normalizedVersion === "2.0.1" &&
            (normalizedUseCase === "HEALTH INSURANCE" || normalizedUseCase === "HEALTH_INSURANCE")
        );
    }, [domain, usecaseId, version]);

    useEffect(() => {
        if (!difficulty_cache) return;

        // Use any to avoid Omit type errors during filtering
        const filtered: any = { ...difficulty_cache };

        // Remove items that should not be displayed/controlled here
        delete filtered.totalDifficulty;
        delete filtered.sensitiveTTL;
        delete filtered.stopAfterFirstNack;
        delete filtered.useGateway;
        delete filtered.timeValidations;

        setDifficultCache(filtered as FilteredDifficultyCache);
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
                    className={`h-7 w-7 text-sky-700 transform transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"
                        }`}
                />
            </div>

            <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                {Object.entries(difficultyCache).length !== 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                        {(Object.entries(difficultyCache) as [string, boolean | undefined][])
                            .filter(([key]) => {
                                if (skipItems.includes(key)) return false;
                                if (key === "encryptionEnabled") {
                                    return isEncryptionAllowed;
                                }
                                return true;
                            })
                            .map(([key, value], index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-white rounded-md shadow p-2 w-full sm:w-auto sm:flex-1"
                                >
                                    <span className="text-sm font-bold text-sky-700">
                                        {keyMapping[key]}
                                    </span>
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
                                                        return JSON.parse(JSON.stringify(prevalue));
                                                    }
                                                );
                                            }}
                                        />
                                    </span>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </button>
    );
};

export default DifficultyCards;
