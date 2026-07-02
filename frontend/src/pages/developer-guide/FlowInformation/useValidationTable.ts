import { useGetValidationTableQuery } from "@store/api";

/** Lazily loads the validation table for a domain/version once, non-blocking. */
export function useValidationTable(domain: string, version: string) {
    const { data } = useGetValidationTableQuery({ domain, version }, { skip: !domain || !version });

    return data?.table ?? null;
}
