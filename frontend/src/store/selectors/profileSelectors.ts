import { useMemo } from "react";
import { useGetPastReportsQuery, useGetScenarioPreferencesQuery } from "@store/api";
import { useAuth } from "@hooks/useAuth";

/** Config and past-report counts derived from RTK Query caches. */
export const useProfileDerivedCounts = () => {
    const { user } = useAuth();
    const username = user?.username;
    const { data: scenarioPreferences } = useGetScenarioPreferencesQuery(undefined, {
        skip: !username,
    });
    const { data: pastReports } = useGetPastReportsQuery(username ?? "", { skip: !username });

    return useMemo(
        () => ({
            configs: Object.keys(scenarioPreferences ?? {}).length,
            pastReports: (pastReports ?? []).length,
        }),
        [scenarioPreferences, pastReports]
    );
};
