import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Spinner from "@components/Shadcn/Spinner";
import { useAuth } from "@hooks/useAuth";
import { useAppDispatch } from "@store/hooks";
import { resetActivityHistoryCount } from "@store/slices/profileShellSlice";
import { useProfileCounts } from "@store/selectors/profileSelectors";
import { ROUTES } from "@constants/routes";
import { ProfileSidebar } from "@pages/user-profile/ProfileSidebar";

const UserProfileLayout = () => {
    const { user } = useAuth();
    const counts = useProfileCounts();

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
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (isAuthLoading || user) {
            return;
        }

        navigate(ROUTES.HOME);
    }, [isAuthLoading, navigate, user]);

    // Match prior Provider unmount: clear history badge when leaving the profile route.
    useEffect(() => {
        return () => {
            dispatch(resetActivityHistoryCount());
        };
    }, [dispatch]);

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

    return <UserProfileLayout />;
};

export default UserProfile;
