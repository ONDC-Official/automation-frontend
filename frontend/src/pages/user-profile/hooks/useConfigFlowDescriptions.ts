import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import type { Flow } from "@/types/flow-types";
import { formatConfigFlowDescription } from "@pages/user-profile/utils/formatConfigFlowDescription";
import type {
    IUseConfigFlowDescriptionsResult,
    ScenarioPreferences,
} from "@pages/user-profile/types";

const buildComboKey = (domain: string, version: string, usecaseId: string): string =>
    `${domain}|${version}|${usecaseId}`;

export const useConfigFlowDescriptions = (
    configs: Record<string, ScenarioPreferences>
): IUseConfigFlowDescriptionsResult => {
    const [comboDescriptions, setComboDescriptions] = useState<Record<string, string | undefined>>(
        {}
    );
    const [isLoading, setIsLoading] = useState(false);

    const configEntries = useMemo(() => Object.entries(configs), [configs]);

    const uniqueCombos = useMemo(() => {
        const combos = new Map<string, { domain: string; version: string; usecaseId: string }>();
        configEntries.forEach(([, config]) => {
            const { domain, version, usecaseId } = config;
            if (!domain || !version || !usecaseId) return;
            combos.set(buildComboKey(domain, version, usecaseId), { domain, version, usecaseId });
        });
        return [...combos.entries()];
    }, [configEntries]);

    useEffect(() => {
        if (!uniqueCombos.length) {
            setComboDescriptions({});
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        Promise.all(
            uniqueCombos.map(async ([comboKey, { domain, version, usecaseId }]) => {
                try {
                    const res = await apiClient.get<{ data: { flows: Flow[] } }>(
                        API_ROUTES.CONFIG.FLOWS,
                        {
                            params: {
                                domain,
                                version,
                                usecase: usecaseId,
                            },
                        }
                    );
                    return [comboKey, formatConfigFlowDescription(res.data?.data?.flows ?? [])] as const;
                } catch {
                    return [comboKey, undefined] as const;
                }
            })
        )
            .then((results) => {
                if (cancelled) return;
                setComboDescriptions(Object.fromEntries(results));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [uniqueCombos]);

    const descriptions = useMemo(() => {
        const mapped: Record<string, string | undefined> = {};
        configEntries.forEach(([configKey, config]) => {
            const { domain, version, usecaseId } = config;
            if (!domain || !version || !usecaseId) {
                mapped[configKey] = undefined;
                return;
            }
            mapped[configKey] = comboDescriptions[buildComboKey(domain, version, usecaseId)];
        });
        return mapped;
    }, [comboDescriptions, configEntries]);

    return { descriptions, isLoading };
};
