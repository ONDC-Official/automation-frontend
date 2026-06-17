import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import type { Flow } from "@/types/flow-types";
import type { IPastReport } from "@pages/user-profile/types";
import { formatConfigFlowDescription } from "@pages/user-profile/utils/formatConfigFlowDescription";
import {
    getPastReportFlowComboKey,
    getPastReportMeta,
} from "@pages/user-profile/utils/getPastReportDisplay";

export const useReportFlowDescriptions = (reports: IPastReport[]) => {
    const [descriptions, setDescriptions] = useState<Record<string, string | undefined>>({});

    const comboKeys = useMemo(() => {
        const map = new Map<
            string,
            { domain: string; version: string; usecaseId: string; testIds: string[] }
        >();

        reports.forEach((report) => {
            const key = getPastReportFlowComboKey(report);
            if (!key) return;

            const { domain, version, usecaseId } = getPastReportMeta(report);
            if (!domain || !version || !usecaseId) return;

            const existing = map.get(key);
            if (existing) {
                existing.testIds.push(report.test_id);
            } else {
                map.set(key, { domain, version, usecaseId, testIds: [report.test_id] });
            }
        });

        return [...map.entries()];
    }, [reports]);

    useEffect(() => {
        if (!comboKeys.length) {
            setDescriptions({});
            return;
        }

        let cancelled = false;

        Promise.all(
            comboKeys.map(async ([, { domain, version, usecaseId, testIds }]) => {
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
                    const description = formatConfigFlowDescription(res.data?.data?.flows ?? []);
                    return testIds.map((testId) => [testId, description] as const);
                } catch {
                    return testIds.map((testId) => [testId, undefined] as const);
                }
            })
        ).then((results) => {
            if (cancelled) return;
            setDescriptions(Object.fromEntries(results.flat()));
        });

        return () => {
            cancelled = true;
        };
    }, [comboKeys]);

    return descriptions;
};
