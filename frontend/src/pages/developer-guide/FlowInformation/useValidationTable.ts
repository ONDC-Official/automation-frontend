import { useEffect, useRef, useState } from "react";
import { fetchValidationTable } from "@services/developerGuideSpecApi";
import type { ValidationTableAction } from "../types";

/** Lazily loads the validation table for a domain/version once, non-blocking. */
export function useValidationTable(domain: string, version: string) {
    const [validationTable, setValidationTable] = useState<Record<
        string,
        ValidationTableAction
    > | null>(null);
    const fetched = useRef(false);

    useEffect(() => {
        if (fetched.current || !domain || !version) return;
        fetched.current = true;
        fetchValidationTable(domain, version)
            .then((result) => {
                if (result?.table) setValidationTable(result.table);
            })
            .catch((err) => {
                console.error("Failed to load validation table", err);
            });
    }, [domain, version]);

    return validationTable;
}
