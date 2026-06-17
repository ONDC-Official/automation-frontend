import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Spinner from "@/components/Shadcn/Spinner";
import { AuthContext } from "@/context/authContext";
import { ROUTES } from "@constants/routes";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { useProfileCounts } from "@hooks/useProfileCounts";
import { ProfileSidebar } from "@pages/user-profile/ProfileSidebar";
import { ProfileShellContext } from "@pages/user-profile/ProfileShellContext";

const UserProfile = () => {
    const { isAuthLoading, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [counts, setCounts] = useProfileCounts();

    useEffect(() => {
        if (isAuthLoading || user) {
            return;
        }

        navigate(ROUTES.HOME);
    }, [isAuthLoading, navigate, user]);

    useEffect(() => {
        const username = user?.username;
        if (!username) return;

        const loadCounts = async () => {
            try {
                const [prefsRes, reportsRes] = await Promise.all([
                    apiClient.get(API_ROUTES.USER.SCENARIO_PREFERENCES).catch(() => ({ data: {} })),
                    apiClient
                        .get(API_ROUTES.USER.PAST_REPORTS(username))
                        .catch(() => ({ data: [] })),
                ]);
                const prefs = prefsRes.data ?? {};
                const reports = Array.isArray(reportsRes.data) ? reportsRes.data : [];
                setCounts((prev) => ({
                    ...prev,
                    configs: Object.keys(prefs).length,
                    pastReports: reports.length,
                }));
            } catch {
                // Badge counts are non-critical
            }
        };

        loadCounts();
    }, [user?.username]);

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
