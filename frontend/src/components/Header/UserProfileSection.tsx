import { useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "@context/userContext";
import { AuthService } from "@services/authService";
import { ROUTES } from "@constants/routes";
import { Button } from "@/components/Shadcn/Button/button";
import { Spinner } from "@/components/Shadcn/Spinner/spinner";
import GitHubIcon from "@/assets/svgs/GitHubIcon";
import { UserProfileMenu } from "@/components/Header/UserProfileMenu";
import { trackEvent } from "@/utils/analytics";
import { cn } from "@/lib/utils";

export const UserProfileSection = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const navigate = useNavigate();
    const { userDetails, refreshUser } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = useCallback(() => {
        trackEvent({
            category: "NAV",
            action: userDetails ? "Clicked on profile" : "Clicked on Login",
            label: userDetails ? "PROFILE" : "LOGIN",
        });

        setIsLoading(true);
        const backendUrl = import.meta.env.VITE_DEVELOPER_GUIDE_BACKEND_URL;
        const authUrl = `${backendUrl}/login`;
        window.location.href = authUrl;
    }, [userDetails]);

    const handleLogout = useCallback(async () => {
        try {
            await AuthService.logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            try {
                await refreshUser();
            } catch (refreshError) {
                console.error("Failed to refresh user after logout:", refreshError);
            }
            navigate(ROUTES.HOME);
        }
    }, [navigate, refreshUser]);

    return (
        <div
            className={cn(
                "relative flex items-center",
                inDrawer && !userDetails ? "w-full" : "shrink-0",
                inDrawer && userDetails ? "min-w-0" : null
            )}
        >
            {userDetails ? (
                <span
                    className={cn(
                        "mr-3 text-sm font-semibold text-n-500 dark:text-n-0",
                        inDrawer && "min-w-0 truncate"
                    )}
                >
                    {userDetails.username}
                </span>
            ) : null}

            {userDetails ? (
                <UserProfileMenu user={userDetails} onLogout={handleLogout} />
            ) : (
                <Button
                    type="button"
                    onClick={handleLogin}
                    isLoading={isLoading}
                    className={cn(
                        "h-9 gap-3 rounded-full border border-n-40 bg-n-900 px-3 py-2 text-body-2 font-medium text-n-0 hover:bg-n-600 dark:text-neutral-900 dark:border-n-0 dark:bg-n-0 dark:hover:border-n-0 dark:hover:bg-n-30",
                        inDrawer && "w-full justify-center"
                    )}
                    title="Login with GitHub"
                >
                    {isLoading ? (
                        <Spinner className="size-6 shrink-0" />
                    ) : (
                        <GitHubIcon className="size-6 text-body-1 font-medium" />
                    )}
                    Login with GitHub
                </Button>
            )}
        </div>
    );
};
