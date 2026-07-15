import { useMemo } from "react";

import { useGetScenarioFormDataQuery } from "@store/api";

/**
 * Loads the scenario form data once and derives the cascading
 * domain → version option lists from the current selection.
 */
export const useScenarioFormData = (domain: string) => {
    const { data } = useGetScenarioFormDataQuery();
    const domains = data?.domain ?? [];

    return useMemo(() => {
        const versions = domains.find((item) => item.key === domain)?.version ?? [];
        return {
            domainOptions: domains.map((item) => item.key),
            versionOptions: versions.map((item) => item.key),
        };
    }, [domains, domain]);
};
