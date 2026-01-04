/**
 * API Routes Constants
 *
 * Centralized constants for all API endpoints used throughout the application.
 * This ensures consistency and makes it easier to update routes if needed.
 */

export const API_ROUTES = {
  // Flow routes
  FLOW: {
    TRIGGER: "/flow/trigger",
    TRIGGER_ACTION: (action: string) => `/flow/trigger/${action}`,
    CURRENT_STATE: "/flow/current-state",
    PROCEED: "/flow/proceed",
    NEW: "/flow/new",
    EXTERNAL_FORM: "/flow/external-form",
    CUSTOM_FLOW: "/flow/custom-flow",
    ACTIONS: "/flow/actions",
  },

  // Session routes
  SESSIONS: {
    BASE: "/sessions",
    CLEAR_FLOW: "/sessions/clearFlow",
    TRANSACTION: "/sessions/transaction",
    EXPECTATION: "/sessions/expectation",
    FLOW_PERMISSION: "/sessions/flowPermission",
  },

  // Database routes
  DB: {
    PAYLOAD: "/db/payload",
    REPORT: "/db/report",
    SESSIONS: "/db/sessions",
  },

  // Config routes
  CONFIG: {
    SCENARIO_FORM_DATA: "/config/senarioFormData",
    REPORTING_STATUS: "/config/reportingStatus",
  },

  // Logs routes
  LOGS: {
    BASE: "/logs",
  },

  // API routes (external services)
  API: {
    SESSIONS_FLOWS: (sessionId: string) => `/api/sessions/flows/${sessionId}`,
  },
} as const;
