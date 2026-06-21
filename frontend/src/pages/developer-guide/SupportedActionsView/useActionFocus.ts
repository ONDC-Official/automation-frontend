import { useMemo, useState } from "react";
import type { SupportedActions } from "../types";
import type { ActionRelationship } from "./types";

// Treat literal "null", empty string, and the JS null key as entry-point sentinels
const isSentinelKey = (k: string) => k === "null" || k === "";

export function useActionFocus(supportedActions: SupportedActions) {
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState<string | null>(null);

    const { supportedActions: actionMap, apiProperties } = supportedActions;

    // APIs that can START a transaction (under the "null" / "" sentinel key)
    const entryPoints = useMemo(() => {
        const all: string[] = [];
        for (const k of Object.keys(actionMap)) {
            if (isSentinelKey(k)) all.push(...(actionMap[k] ?? []));
        }
        return new Set(all);
    }, [actionMap]);

    // All real API action keys, excluding sentinels
    const allApis = useMemo(
        () => Object.keys(actionMap).filter((k) => !isSentinelKey(k)),
        [actionMap]
    );

    const filteredApis = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allApis;
        return allApis.filter((api) => api.toLowerCase().includes(q));
    }, [allApis, search]);

    const getRelationship = (api: string): ActionRelationship => {
        if (!focused) return "none";
        if (api === focused) return "focused";
        if ((actionMap[focused] ?? []).includes(api)) return "next";
        if (
            (apiProperties[focused]?.transaction_partner ?? []).includes(api) ||
            apiProperties[focused]?.async_predecessor === api
        )
            return "history";
        return "none";
    };

    const toggleFocus = (api: string) => setFocused((prev) => (prev === api ? null : api));

    return {
        search,
        setSearch,
        focused,
        setFocused,
        toggleFocus,
        actionMap,
        apiProperties,
        entryPoints,
        allApis,
        filteredApis,
        getRelationship,
    };
}
