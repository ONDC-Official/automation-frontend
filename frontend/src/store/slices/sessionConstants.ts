import type { SessionMetadataValue } from "@/types/session-types";

/** Stable empty defaults — same reference across renders (mirrors legacy local useState). */
export const SESSION_EMPTY_RECORD = {} as Record<string, unknown>;
export const SESSION_EMPTY_METADATA = {} as Record<string, SessionMetadataValue>;
