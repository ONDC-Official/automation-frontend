import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import type { IScenarioDomainItem } from "@pages/protocol-playground/ui/starter/types";

/**
 * Loads the scenario form data once and derives the cascading
 * domain → version option lists from the current selection.
 */
export const useScenarioFormData = (domain: string) => {
    const [domains, setDomains] = useState<IScenarioDomainItem[]>([]);

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const response = await apiClient.get<{ domain?: IScenarioDomainItem[] }>(
                    API_ROUTES.CONFIG.SCENARIO_FORM_DATA
                );
                setDomains(response.data.domain ?? []);
            } catch (e) {
                console.error("error while fetching form field data", e);
            }
        };
        fetchFormData();
    }, []);

    return useMemo(() => {
        const versions = domains.find((item) => item.key === domain)?.version ?? [];
        return {
            domainOptions: domains.map((item) => item.key),
            versionOptions: versions.map((item) => item.key),
        };
    }, [domains, domain]);
};
