import { ROUTES } from "@constants/routes";
import type { IProfileNavItem } from "@pages/user-profile/types";

export const CONFIG_DISPLAY_NAME_MAP: Record<string, string> = {
    "personal-loan": "Personal Loan",
    "Personal Loan": "Personal Loan",
};

export const ENV_OPTIONS = ["PRE-PRODUCTION", "STAGING", "PRODUCTION"];

export const PROFILE_NAV_ITEMS: IProfileNavItem[] = [
    { label: "Configs", to: ROUTES.PROFILE, countKey: "configs" },
    { label: "Past reports", to: ROUTES.PROFILE_PAST_REPORTS, countKey: "pastReports" },
    { label: "Activity history", to: ROUTES.PROFILE_HISTORY, countKey: "history" },
];

export const PROFILE_PAGE_COPY = {
    configs: {
        title: "Profile",
        subtitle: "Your account, saved test configs, and report history in one place.",
        formTitle: "Create a new config",
        formDescription: "Fill the details to begin flow testing.",
        listTitle: "Scenario test configs",
    },
    pastReports: {
        title: "Past reports",
        subtitle: "Test runs from your scenario sessions. Mandatory checks decide certification.",
    },
    history: {
        title: "History",
        subtitle:
            "View and manage your previous sessions. Check reports or resume a past session anytime.",
        searchLabel: "Enter subscriber details",
    },
} as const;
