/**
 * Utility functions for Schema Validation
 */

import { toast } from "react-toastify";
import type { ParsedPayload, ActiveDomainConfig, PayloadContext } from "./types";
import { TOAST_MESSAGES } from "./constants";

/**
 * Parses a JSON payload string and validates its structure
 *
 * @param payload - The JSON string to parse
 * @returns The parsed payload object, or null if parsing fails
 * @throws Shows toast error if payload is invalid or is an array
 */
export const parsePayload = (payload: string): ParsedPayload | null => {
  if (payload === "") {
    toast.warn(TOAST_MESSAGES.EMPTY_PAYLOAD);
    return null;
  }

  try {
    const parsedPayload = JSON.parse(payload) as ParsedPayload;

    if (Array.isArray(parsedPayload)) {
      toast.warn(TOAST_MESSAGES.ARRAY_NOT_SUPPORTED);
      return null;
    }

    return parsedPayload;
  } catch (error) {
    console.error("Error while parsing payload:", error);
    toast.error(TOAST_MESSAGES.INVALID_PAYLOAD);
    return null;
  }
};

/**
 * Validates that the payload contains a required action in its context
 *
 * @param parsedPayload - The parsed payload object
 * @returns The action string if valid, null otherwise
 */
export const validateAction = (parsedPayload: ParsedPayload): string | null => {
  const action = parsedPayload?.context?.action;

  if (!action) {
    toast.warn(TOAST_MESSAGES.MISSING_ACTION);
    return null;
  }

  return action;
};

/**
 * Checks if a domain and version combination is active in the configuration
 *
 * @param activeDomain - The active domain configuration
 * @param context - The payload context containing domain and version information
 * @returns True if the domain and version are active, false otherwise
 */
export const isDomainActive = (activeDomain: ActiveDomainConfig, context: PayloadContext): boolean => {
  if (!context.domain) {
    return false;
  }

  const version = context.version || context.core_version;
  if (!version) {
    return false;
  }

  for (const [, domains] of Object.entries(activeDomain)) {
    for (const domain of domains) {
      if (domain.key === context.domain) {
        for (const ver of domain.version) {
          if (ver.key === version) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

/**
 * Validates domain and version are active, shows toast if not
 *
 * @param activeDomain - The active domain configuration
 * @param context - The payload context containing domain and version information
 * @returns True if domain and version are active, false otherwise
 */
export const validateDomainAndVersion = (activeDomain: ActiveDomainConfig, context: PayloadContext): boolean => {
  const isValid = isDomainActive(activeDomain, context);

  if (!isValid) {
    toast.warn(TOAST_MESSAGES.DOMAIN_NOT_ACTIVE);
  }

  return isValid;
};
