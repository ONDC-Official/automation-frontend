/**
 * Route constants for the application
 * All route paths should be defined here and used throughout the project
 */
export const ROUTES = {
  HOME: "/home",
  SCHEMA: "/schema",
  SCENARIO: "/scenario",
  FLOW_TESTING: "/flow-testing",
  LOGIN: "/login",
  PROFILE: "/profile",
  TOOLS: "/tools",
  SELLER_ONBOARDING: "/seller-onboarding",
  PLAYGROUND: "/playground",
  WALKTHROUGH: "/walkthrough",
  HISTORY: "/history",
  DB_BACK_OFFICE: "/db-back-office",
  ROOT: "/",
} as const;

/**
 * Type for route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
