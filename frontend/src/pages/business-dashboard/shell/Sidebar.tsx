import { NavLink } from "react-router-dom";
import { Activity, LogOut } from "lucide-react";
import Button from "@pages/business-dashboard/components/Button";
import Tooltip from "@pages/business-dashboard/components/Tooltip";
import { useLogout } from "@pages/business-dashboard/hooks/useAuth";
import { cn } from "@pages/business-dashboard/lib/utils";
import { APP_NAME, APP_TAGLINE, DASHBOARD_ROOT, NAV } from "@pages/business-dashboard/constants";

/**
 * The standalone app had a theme toggle here; the workbench header already owns
 * one globally (Header/ThemeToggle), so only sign-out remains.
 */
const Sidebar = () => {
    const { logout, isPending } = useLogout();

    return (
        <aside
            data-slot="sidebar"
            className="border-sidebar-border bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r md:flex md:sticky md:top-16 md:h-[calc(100svh-4rem)]"
        >
            <div className="border-sidebar-border flex items-center gap-2 border-b px-4 py-3">
                <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                    <Activity className="size-4" />
                </span>
                <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold">{APP_NAME}</span>
                    <span className="text-muted-foreground text-xs">{APP_TAGLINE}</span>
                </div>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 p-2">
                {NAV.map(({ label, to, icon: Icon, description }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === DASHBOARD_ROOT}
                        title={description}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                            )
                        }
                    >
                        <Icon className="size-4" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="border-sidebar-border border-t p-2">
                <Tooltip content="Sign out of the dashboard">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sign out"
                        disabled={isPending}
                        onClick={logout}
                    >
                        <LogOut />
                    </Button>
                </Tooltip>
            </div>
        </aside>
    );
};

export default Sidebar;
