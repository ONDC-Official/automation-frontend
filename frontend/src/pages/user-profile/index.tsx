import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Spinner from "@/components/Shadcn/Spinner";
import { useAuth } from "@hooks/useAuth";
import { ROUTES } from "@constants/routes";
import { ProfileSidebar } from "@pages/user-profile/ProfileSidebar";
import { ProfileShellProvider, useProfileShell } from "@pages/user-profile/ProfileShellContext";

const UserProfileLayout = () => {
    const { user } = useAuth();
    const { counts } = useProfileShell();

    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-surface-muted">
            <ProfileSidebar username={user.username} avatarUrl={user.avatarUrl} counts={counts} />
            <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)] bg-surface-elevated">
                <Outlet />
            </main>
        </div>
    );
};

const UserProfile = () => {
    const { isAuthLoading, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthLoading || user) {
            return;
        }

        navigate(ROUTES.HOME);
    }, [isAuthLoading, navigate, user]);

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
        <ProfileShellProvider>
            <UserProfileLayout />
        </ProfileShellProvider>
    );
};

export default UserProfile;
