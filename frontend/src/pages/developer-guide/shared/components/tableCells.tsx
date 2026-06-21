import type { ReactNode } from "react";

/** Shared "no value" convention for GuideTable-based tables (ValidationsTable, SchemaTree). */
export const EMPTY_PLACEHOLDER = "—";

export function isEmptyCell(value: string | undefined | null): boolean {
    return value == null || String(value).trim() === "";
}

export function emptyCell(): ReactNode {
    return <span className="text-slate-300">{EMPTY_PLACEHOLDER}</span>;
}
