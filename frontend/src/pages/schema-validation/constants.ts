/**
 * Constants for the Schema Validation page
 */

/**
 * Instructions displayed to users on how to use the schema validation tool
 */
export const INSTRUCTIONS = [
  "Paste/ Upload Your API Payload",
  "Based on the payload pasted, the tool takes the domain and the version for testing compliance",
  'Click "Validate" to check for errors in API schema, data types, required fields and enums',
  "Review errors on missing or incorrect fields and fix issues",
  "Copy corrected payload as required",
] as const;

/**
 * Local storage key for persisting the payload
 */
export const PAYLOAD_STORAGE_KEY = "schema-validation-payload";

/**
 * Editor configuration constants
 */
export const EDITOR_CONFIG = {
  theme: "vs",
  language: "json",
  fontSize: 14,
  padding: { top: 16, bottom: 16 },
} as const;

/**
 * Toast messages
 */
export const TOAST_MESSAGES = {
  EMPTY_PAYLOAD: "Add payload for the request",
  ARRAY_NOT_SUPPORTED: "Array of payloads not supported",
  INVALID_PAYLOAD: "Invalid payload",
  MISSING_ACTION: "action missing from context",
  DOMAIN_NOT_ACTIVE: "Domain or version not yet active. To check the list of active domain visit home page.",
  VALIDATION_ERROR: "Something went wrong",
} as const;

/**
 * Success message for valid schema
 */
export const SUCCESS_MESSAGE = "\n**Schema validations passed!**\n";
