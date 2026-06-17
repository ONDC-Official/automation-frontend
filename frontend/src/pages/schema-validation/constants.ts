/**
 * Constants for the Schema Validation page
 */

import { availableDomains } from "@/constants/common";
import { ISchemaGuideStepDefinition } from "@/pages/schema-validation/types";

/**
 * Example JSON payload shown in the schema guide accordion
 */
export const EXAMPLE_PAYLOAD = `{
  "context": {
    "domain": "ONDC:RET10",
    "action": "search",
    "country": "IND",
    "city": "std:080",
    "core_version": "1.2.5",
    "bap_id": "bnp.com",
    "bap_uri": "https://bnp.com/ondc",
    "transaction_id": "T1",
    "message_id": "M1",
    "timestamp": "2025-01-08T08:00:00.000Z",
    "ttl": "PT30S"
  },
  "message": {
    "intent": {
      "fulfillment": {
        "type": "Delivery"
      },
      "payment": {
        "@ondc/org/buyer_app_finder_fee_type": "percent",
        "@ondc/org/buyer_app_finder_fee_amount": "3.54"
      }
    }
  }
}`;

/** Human-readable list of supported domains for the guide */
export const domainSummary = availableDomains
    .map((domain) => `${domain.code} (Version: ${domain.version})`)
    .join(" / ");

/** Step definitions for the schema validation how-to accordion */
export const SCHEMA_GUIDE_STEPS: ISchemaGuideStepDefinition[] = [
    {
        key: "1",
        label: "1. Workbench is Currently available for the following domains",
        description: `${domainSummary} — others coming soon.`,
        descriptionType: "text",
    },
    {
        key: "2",
        label: "2. Paste/Upload Your API Payload. For Example: For search payload validation, paste the JSON:",
        description: EXAMPLE_PAYLOAD,
        descriptionType: "code",
    },
    {
        key: "3",
        label: "3. Domain and version compliance",
        description:
            "The tool takes the domain and the version for testing compliance. Please ensure domain and version are as per step #1.",
        descriptionType: "text",
    },
    {
        key: "4",
        label: '4. Click "Validate" to check for errors',
        description:
            "Click Validate to check for errors in API schema, data types, required fields and enums.",
        descriptionType: "text",
    },
    {
        key: "5",
        label: "5. Review validation errors in the panel below the editor",
        description:
            "If there are errors in the payload, they appear below the editor with highlighted paths. Use View All to expand the full error list.",
        descriptionType: "text",
    },
    {
        key: "6",
        label: "6. Resolve errors and validate again",
        description:
            "Resolve the errors shown, update your payload, and validate again from step #2.",
        descriptionType: "text",
    },
    {
        key: "7",
        label: "7. Successful validation message",
        description:
            "When there are no errors, the panel below the editor shows: Schema is valid — Schema validations passed!",
        descriptionType: "text",
    },
];

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
 * Validation messages shown in the validation errors panel
 */
export const VALIDATION_MESSAGES = {
    EMPTY_PAYLOAD: "Add payload for the request",
    ARRAY_NOT_SUPPORTED: "Array of payloads not supported",
    INVALID_PAYLOAD: "Invalid payload",
    MISSING_ACTION: "action missing from context",
    DOMAIN_NOT_ACTIVE:
        "Domain or version not yet active. To check the list of active domain visit home page.",
    VALIDATION_ERROR: "Something went wrong",
};

/** JSON paths used to highlight client validation errors in the editor */
export const VALIDATION_PATHS = {
    MISSING_ACTION: "/context/action",
    DOMAIN_NOT_ACTIVE: "/context/domain",
};

/**
 * Success message for valid schema
 */
export const SUCCESS_MESSAGE = "\n**Schema validations passed!**\n";

export const MARKDOWN_BLOCK_REGEX = /#### \*\*([^*]+)\*\*\s*\n+([\s\S]*?)(?=#### \*\*|$)/g;
export const LIST_ITEM_REGEX = /^-\s+/;

export const AJV_AT_PATH_REGEX = /at\s+(['"])(\/[^'"]+)\1\s*:\s*(.+)/i;
export const ADDITIONAL_PROPERTY_REGEX = /additional properties\s+(['"])([^'"]+)\1\s+not allowed/i;
