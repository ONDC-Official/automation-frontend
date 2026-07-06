import { useCallback, useEffect, useState } from "react";
import { useGetChangelogQuery } from "@store/api";
import type { TopLevelView } from "../types";

/** Lazily fetches the changelog the first time the Changelog tab is opened. */
export function useLazyChangelog(domainKey: string, versionKey: string, activeView: TopLevelView) {
    const [everOpened, setEverOpened] = useState(false);

    useEffect(() => {
        if (activeView === "changelog") setEverOpened(true);
    }, [activeView]);

    const { data, isFetching } = useGetChangelogQuery(
        { domain: domainKey, version: versionKey },
        { skip: !everOpened || !domainKey || !versionKey }
    );

    const resetForNewRoute = useCallback(() => {
        setEverOpened(false);
    }, []);

    return { lazyChangelog: data ?? null, changelogLoading: isFetching, resetForNewRoute };
}
