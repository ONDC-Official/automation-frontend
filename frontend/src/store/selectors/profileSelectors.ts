import { useMemo } from "react";
import { useGetPastReportsQuery, useGetScenarioPreferencesQuery } from "@store/api";
import { useAuth } from "@hooks/useAuth";
import { useAppSelector } from "@store/hooks";
import { selectActivityHistoryCount } from "@store/slices/profileShellSlice";
import type { IProfileCounts } from "@pages/user-profile/types";

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

/** Full profile sidebar counts — RTK Query (configs, reports) + Redux (activity history). */
export const useProfileCounts = (): IProfileCounts => {
    const { configs, pastReports } = useProfileDerivedCounts();
    const history = useAppSelector(selectActivityHistoryCount);

    return useMemo(
        () => ({
            configs,
            pastReports,
            history,
        }),
        [configs, pastReports, history]
    );
};
