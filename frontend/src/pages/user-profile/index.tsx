import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Spinner from "@/components/Shadcn/Spinner";
import { AuthContext } from "@/context/authContext";
import { ROUTES } from "@constants/routes";
import { useGetScenarioPreferencesQuery, useGetPastReportsQuery } from "@store/api";
import { ProfileSidebar } from "@pages/user-profile/ProfileSidebar";
import { ProfileShellContext, useProfileShell } from "@pages/user-profile/ProfileShellContext";

const UserProfile = () => {
    const { isAuthLoading, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { counts, setCounts } = useProfileShell();
    const username = user?.username;

    useEffect(() => {
        if (isAuthLoading || user) {
            return;
        }

        navigate(ROUTES.HOME);
    }, [isAuthLoading, navigate, user]);

    const { data: scenarioPreferences } = useGetScenarioPreferencesQuery(undefined, {
        skip: !username,
    });
    const { data: pastReports } = useGetPastReportsQuery(username ?? "", { skip: !username });

    useEffect(() => {
        if (!username) return;
        setCounts((prev) => ({
            ...prev,
            configs: Object.keys(scenarioPreferences ?? {}).length,
            pastReports: (pastReports ?? []).length,
        }));
    }, [username, scenarioPreferences, pastReports, setCounts]);

    if (isAuthLoading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-surface-muted">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <ProfileShellContext.Provider value={{ counts, setCounts }}>
            <div className="flex min-h-[calc(100vh-4rem)] bg-surface-muted">
                <ProfileSidebar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    counts={counts}
                />
                <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)] bg-surface-elevated">
                    <Outlet />
                </main>
            </div>
        </ProfileShellContext.Provider>
    );
};

export default UserProfile;
