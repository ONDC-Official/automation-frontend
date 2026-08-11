import { Outlet } from "react-router-dom";

import { TooltipProvider } from "@components/Shadcn/Tooltip";
import { useSyncSession } from "@pages/business-dashboard/hooks/useAuth";
import { useAppSelector } from "@store/hooks";
import { selectDashboardAuthenticated } from "@store/slices/businessDashboardSlice";
import AuthGate from "./AuthGate";
import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";

const ShellBody = () => {
    // Reconciles the persisted auth flag with GET /dashboard/auth/me once per mount.
    useSyncSession();
    const isAuthenticated = useAppSelector(selectDashboardAuthenticated);

    if (!isAuthenticated) return <AuthGate />;

    return (
        <div className="flex flex-1 flex-col md:flex-row md:items-start">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <MobileNav />
                <main className="flex-1 p-4">
                    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

/**
 * Layout arithmetic matches DeveloperGuideShell: the workbench header is fixed
 * at 4rem, so the shell is `min-h-[calc(100svh-4rem)]` and the sidebar sticks at
 * `top-16`. Using min-height rather than a fixed height keeps the global footer
 * reachable below the dashboard.
 *
 * Light/dark is the workbench's own — Header/ThemeToggle drives `.dark` through
 * themeSlice, and the dashboard's tokens hang off that same class, so it has no
 * theme state of its own.
 */
const DashboardShell = () => (
    <TooltipProvider>
        <div className="bd-root bg-background text-foreground flex min-h-[calc(100svh-4rem)] flex-col">
            <ShellBody />
        </div>
    </TooltipProvider>
);

export default DashboardShell;
