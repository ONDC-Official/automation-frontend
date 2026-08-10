import { Download, FileText, LayoutDashboard, ListFilter, Network } from "lucide-react";
import { ROUTES } from "@constants/routes";

/** Where the dashboard is mounted. Every internal link is built off this. */
export const DASHBOARD_ROOT = ROUTES.BUSINESS;

/** Branding for the sidebar and the password card. */
export const APP_NAME = "ONDC Workbench";
export const APP_TAGLINE = "Business analytics";

/** The sidebar maps over this. Adding a page means adding an entry here. */
export const NAV = [
    {
        label: "Overview",
        to: ROUTES.BUSINESS,
        icon: LayoutDashboard,
        description: "KPIs and trends",
    },
    {
        label: "Sessions",
        to: ROUTES.BUSINESS_SESSIONS,
        icon: ListFilter,
        description: "Filter and drill into sessions",
    },
    {
        // Network, not Users: these are systems, and the users table cannot be
        // attributed to sessions at all.
        label: "Participants",
        to: ROUTES.BUSINESS_PARTICIPANTS,
        icon: Network,
        description: "Who is testing, and since when",
    },
    {
        label: "Reports",
        to: ROUTES.BUSINESS_REPORTS,
        icon: FileText,
        description: "Generated test reports",
    },
    {
        label: "Export",
        to: ROUTES.BUSINESS_EXPORT,
        icon: Download,
        description: "Build a CSV of the current slice",
    },
] as const;
