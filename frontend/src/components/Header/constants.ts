import { ROUTES } from "@constants/routes";
import { NavLink } from "./types";

export const navLinks: NavLink[] = [
  {
    label: "Home",
    href: ROUTES.HOME,
    selected: true,
    analytics: {
      category: "NAV",
      action: "Clicked on home",
      label: "HOME",
    },
  },
  {
    label: "Schema Validation",
    href: ROUTES.SCHEMA,
    selected: false,
    analytics: {
      category: "NAV",
      action: "Clicked in schema validation",
      label: "SCHEMA_VALIDATION",
    },
  },
  {
    label: "Scenario Testing",
    href: ROUTES.SCENARIO,
    selected: false,
    analytics: {
      category: "NAV",
      action: "Clicked in scenario testing",
      label: "SCENARIO_TESTING",
    },
  },
  {
    label: "Tools",
    href: ROUTES.TOOLS,
    selected: false,
    subMenu: [
      { label: "Seller Onboarding", href: ROUTES.SELLER_ONBOARDING },
      { label: "Auth Header Tool", href: ROUTES.AUTH_HEADER },
    ],
    analytics: {
      category: "NAV",
      action: "Clicked in tools",
      label: "TOOLS",
    },
  },
  {
    label: "Support",
    href: "",
    selected: false,
    analytics: {
      category: "NAV",
      action: "Clicked in support",
      label: "SUPPORT",
    },
  },
];
