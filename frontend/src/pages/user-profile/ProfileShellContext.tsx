import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { IProfileCounts } from "@pages/user-profile/types";
import { useProfileDerivedCounts } from "@store/selectors/profileSelectors";

interface ProfileShellContextValue {
    counts: IProfileCounts;
    setActivityHistoryCount: (count: number) => void;
}

const ProfileShellContext = createContext<ProfileShellContextValue | null>(null);

/** Profile sidebar counts: configs/reports from RTK Query; history from activity search results. */
export const ProfileShellProvider = ({ children }: { children: ReactNode }) => {
    const { configs, pastReports } = useProfileDerivedCounts();
    const [activityHistoryCount, setActivityHistoryCount] = useState(0);

    const setActivityHistoryCountStable = useCallback((count: number) => {
        setActivityHistoryCount(count);
    }, []);

    const counts = useMemo<IProfileCounts>(
        () => ({
            configs,
            pastReports,
            history: activityHistoryCount,
        }),
        [configs, pastReports, activityHistoryCount]
    );

    const value = useMemo(
        () => ({ counts, setActivityHistoryCount: setActivityHistoryCountStable }),
        [counts, setActivityHistoryCountStable]
    );

    return <ProfileShellContext.Provider value={value}>{children}</ProfileShellContext.Provider>;
};

export const useProfileShell = (): ProfileShellContextValue => {
    const ctx = useContext(ProfileShellContext);
    if (!ctx) {
        throw new Error("useProfileShell must be used within ProfileShellProvider");
    }
    return ctx;
};
