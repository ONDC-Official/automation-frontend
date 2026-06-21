import { useCallback, useEffect, useRef, useState } from "react";
import { fetchChangelog } from "@services/developerGuideSpecApi";
import type { ChangelogEntry } from "../../types";
import type { TopLevelView } from "../types";

/** Lazily fetches the changelog the first time the Changelog tab is opened. */
export function useLazyChangelog(domainKey: string, versionKey: string, activeView: TopLevelView) {
    const [lazyChangelog, setLazyChangelog] = useState<ChangelogEntry[] | null>(null);
    const [changelogLoading, setChangelogLoading] = useState(false);
    const changelogFetched = useRef(false);

    const loadChangelogIfNeeded = useCallback(() => {
        if (changelogFetched.current || !domainKey || !versionKey) return;
        changelogFetched.current = true;
        setChangelogLoading(true);
        fetchChangelog(domainKey, versionKey)
            .then((result) => setLazyChangelog(result))
            .catch((err) => {
                console.error("Failed to load changelog", err);
                setLazyChangelog(null);
            })
            .finally(() => setChangelogLoading(false));
    }, [domainKey, versionKey]);

    useEffect(() => {
        if (activeView === "changelog") loadChangelogIfNeeded();
    }, [activeView, loadChangelogIfNeeded]);

    const resetForNewRoute = useCallback(() => {
        setLazyChangelog(null);
        changelogFetched.current = false;
    }, []);

    return { lazyChangelog, changelogLoading, resetForNewRoute };
}
