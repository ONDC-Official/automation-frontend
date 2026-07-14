import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { useGitHubLogin } from "@hooks/useGitHubLogin";
import { ROUTES } from "@constants/routes";
import { Button } from "@components/Shadcn/Button";
import LoadingOverlay from "@components/Shadcn/LoadingOverlay";
import GitHubIcon from "@assets/svgs/GitHubIcon";
import { UserProfileMenu } from "@components/Header/UserProfileMenu";
import { trackEvent } from "@utils/analytics";
import { cn } from "@/lib/utils";

export const UserProfileSection = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { startLogin, isLoginRedirecting } = useGitHubLogin();

    const handleLogin = useCallback(() => {
        trackEvent({
            category: "NAV",
            action: user ? "Clicked on profile" : "Clicked on Login",
            label: user ? "PROFILE" : "LOGIN",
        });

        startLogin();
    }, [startLogin, user]);

    const handleLogout = useCallback(() => {
        try {
            logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            navigate(ROUTES.HOME);
        }
    }, [navigate, logout]);

    return (
        <div
            className={cn(
                "relative flex items-center",
                inDrawer && !user ? "w-full" : "shrink-0",
                inDrawer && user ? "min-w-0" : null
            )}
        >
            {user ? (
                <span
                    className={cn(
                        "mr-3 text-sm font-semibold text-n-500 dark:text-n-0",
                        inDrawer && "min-w-0 truncate"
                    )}
                >
                    {user.username}
                </span>
            ) : null}

            {user ? (
                <UserProfileMenu user={user} onLogout={handleLogout} />
            ) : (
                <Button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoginRedirecting}
                    className={cn(
                        "h-9 gap-2 rounded-full border border-n-40 bg-n-900 px-2.5 py-2 text-body-2 font-medium text-n-0 hover:bg-n-600 dark:text-neutral-900 dark:border-n-0 dark:bg-n-0 dark:hover:border-n-0 dark:hover:bg-n-30",
                        inDrawer && "w-full justify-center gap-3 px-3"
                    )}
                    title="Login with GitHub"
                >
                    <GitHubIcon className="size-6 text-body-1 font-medium" />
                    {inDrawer ? "Login with GitHub" : "Login"}
                </Button>
            )}

            {isLoginRedirecting ? <LoadingOverlay /> : null}
        </div>
    );
};
