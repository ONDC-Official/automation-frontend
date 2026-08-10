import { NavLink } from "react-router-dom";
import { cn } from "@dashboard/lib/utils";
import { DASHBOARD_ROOT, NAV } from "@dashboard/constants";

/** Below `md` the sidebar is hidden, so the nav collapses into a bar. */
const MobileNav = () => (
    <div className="border-border flex shrink-0 items-center gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
        {NAV.map(({ label, to, icon: Icon }) => (
            <NavLink
                key={to}
                to={to}
                end={to === DASHBOARD_ROOT}
                className={({ isActive }) =>
                    cn(
                        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs whitespace-nowrap transition-colors",
                        isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/60"
                    )
                }
            >
                <Icon className="size-3.5" />
                {label}
            </NavLink>
        ))}
    </div>
);

export default MobileNav;
