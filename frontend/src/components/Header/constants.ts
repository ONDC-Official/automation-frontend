import { ROUTES } from "@constants/routes";
import { INavLink } from "@components/Header/types";
import { cn } from "@/lib/utils";

export const navLinks: INavLink[] = [
    {
        label: "Home",
        href: ROUTES.HOME,
        analytics: {
            category: "NAV",
            action: "Clicked on home",
            label: "HOME",
        },
    },
    {
        label: "Developer Guide",
        href: ROUTES.DEVELOPER_GUIDE,
        analytics: {
            category: "NAV",
            action: "Clicked in developer guide",
            label: "DEVELOPER_GUIDE",
        },
    },
    {
        label: "Schema Validation",
        href: ROUTES.SCHEMA,
        analytics: {
            category: "NAV",
            action: "Clicked in schema validation",
            label: "SCHEMA_VALIDATION",
        },
    },
    {
        label: "Scenario Testing",
        href: ROUTES.SCENARIO,
        analytics: {
            category: "NAV",
            action: "Clicked in scenario testing",
            label: "SCENARIO_TESTING",
        },
    },
    {
        label: "Tools & SDK",
        subMenu: [
            { label: "Seller Onboarding", href: ROUTES.SELLER_ONBOARDING },
            { label: "Protocol Playground", href: ROUTES.PLAYGROUND },
        ],
        analytics: {
            category: "NAV",
            action: "Clicked in tools",
            label: "TOOLS",
        },
    },
    {
        label: "Support",
        href: ROUTES.SUPPORT,
        analytics: {
            category: "NAV",
            action: "Clicked in support",
            label: "SUPPORT",
        },
    },
];

export const mobileDrawerNavClassName = cn(
    "flex flex-col p-4 pt-6",
    "[&_[data-slot=navigation-menu]]:w-full [&_[data-slot=navigation-menu]]:max-w-none [&_[data-slot=navigation-menu]]:flex-col [&_[data-slot=navigation-menu]]:items-stretch [&_[data-slot=navigation-menu]]:justify-start",
    "[&_[data-slot=navigation-menu-list]]:w-full [&_[data-slot=navigation-menu-list]]:flex-col [&_[data-slot=navigation-menu-list]]:items-stretch [&_[data-slot=navigation-menu-list]]:justify-start [&_[data-slot=navigation-menu-list]]:gap-0",
    "[&_[data-slot=navigation-menu-item]]:w-full",
    "[&_[data-slot=navigation-menu-trigger]]:w-full [&_[data-slot=navigation-menu-trigger]]:justify-start [&_[data-slot=navigation-menu-trigger]]:px-4 [&_[data-slot=navigation-menu-trigger]]:py-3",
    "[&_[data-slot=navigation-menu-content]]:static [&_[data-slot=navigation-menu-content]]:w-full [&_[data-slot=navigation-menu-content]]:border-0 [&_[data-slot=navigation-menu-content]]:bg-transparent [&_[data-slot=navigation-menu-content]]:p-0 [&_[data-slot=navigation-menu-content]]:pl-4 [&_[data-slot=navigation-menu-content]]:shadow-none",
    "[&_[data-slot=navigation-menu-content][data-state=open]]:visible [&_[data-slot=navigation-menu-content][data-state=open]]:h-auto [&_[data-slot=navigation-menu-content][data-state=open]]:opacity-100",
    "[&_[data-slot=navigation-menu-link]]:w-full [&_[data-slot=navigation-menu-link]]:justify-start [&_[data-slot=navigation-menu-link]]:px-4 [&_[data-slot=navigation-menu-link]]:py-3"
);
