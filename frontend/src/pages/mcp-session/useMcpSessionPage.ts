import { useCallback, useEffect, useMemo, useState } from "react";
import {
    initialMcpEngineTarget,
    readStoredMcpEngineTarget,
    storeMcpEngineTarget,
    type McpEngineTarget,
} from "@services/mcpEngineClient";
import { useGetMcpSessionQuery, useLazyGetMcpPayloadQuery } from "@store/api";
import { MCP_FALLBACK_POLL_MS } from "./constants";
import { orderRuns } from "./utils";

/** What the inspector on the right is currently showing. */
export interface McpInspectorState {
    title: string;
    request: unknown;
    response: unknown;
    loading: boolean;
}

/**
 * Everything the viewer page knows, in one place.
 *
 * The page component below it renders and does nothing else — the repo's own
 * convention, and it earns its keep here because the live-update path is the
 * only interesting logic and it belongs nowhere near JSX.
 */
export function useMcpSessionPage() {
    /**
     * Where the engine came from: this visit's link, or this tab's memory.
     *
     * Resolved in a `useState` initialiser so the first paint already knows —
     * doing it in an effect would flash the "incomplete link" state on every
     * load.
     *
     * **The stored fallback is not optional.** The fragment is cleared in the
     * effect below, so a reload arrives with an empty hash; without the
     * remembered copy the page tells somebody who pressed refresh that their
     * link is incomplete. The two halves look independent and are not.
     */
    // `undefined` is "still looking", `null` is "asked everywhere, not there".
    // Only the stored read below may produce `null` — the link is allowed to
    // say "nothing here" without ending the search, which is precisely what a
    // reload looks like. `initialMcpEngineTarget` is what enforces that, and it
    // has a test on it because getting it backwards silently disables the
    // fallback.
    const [target, setTarget] = useState<McpEngineTarget | null | undefined>(() =>
        initialMcpEngineTarget(window.location.hash)
    );

    useEffect(() => {
        if (target === undefined) {
            // Nothing in the link, so this is a reload: ask the tab.
            let cancelled = false;
            void readStoredMcpEngineTarget().then((stored) => {
                if (!cancelled) setTarget(stored);
            });
            return () => {
                cancelled = true;
            };
        }

        if (target === null) return;

        // Remember before cleaning up, or a reload landing between the two
        // loses the engine entirely.
        void storeMcpEngineTarget(target);

        // Then take the token out of the address bar: out of the history entry,
        // out of any screenshot, and out of a URL somebody copies to a
        // colleague believing they are sharing a page rather than a credential.
        if (window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname);
        }
        return;
    }, [target]);

    const [streaming, setStreaming] = useState(false);
    const [inspector, setInspector] = useState<McpInspectorState | null>(null);
    const [openRunId, setOpenRunId] = useState<string | null>(null);

    // The stream is the change signal; this is what it bumps to make the
    // queries refetch. A counter rather than the event's own seq, because a
    // refetch is wanted for *any* event and seq collisions across engines are
    // possible.
    const [revision, setRevision] = useState(0);

    const [fetchPayload] = useLazyGetMcpPayloadQuery();

    const sessionQuery = useGetMcpSessionQuery(
        target ? { ...target, sessionId: target.sessionId } : skip(),
        {
            skip: !target,
            // Only when the stream is down. With it up, every change already
            // arrives as an event and polling on top would be pure waste.
            pollingInterval: streaming ? 0 : MCP_FALLBACK_POLL_MS,
            refetchOnMountOrArgChange: true,
        }
    );

    // `revision` is not a query argument — bumping it must refetch, not remount
    // the cache entry, or every event would flash the whole page through its
    // loading state.
    const { refetch } = sessionQuery;
    useEffect(() => {
        if (revision > 0) void refetch();
    }, [revision, refetch]);

    /**
     * The live feed.
     *
     * `EventSource`, which cannot set headers — so the token goes in the query
     * string here and only here. That is the engine's own trade-off, made in
     * the same place: the alternative is no live updates at all.
     *
     * Nothing here reads the event bodies — a message arriving is only ever a
     * signal to refetch the state that actually matters (`revision`). On error
     * the browser reconnects by itself, and `streaming` flips false so the
     * fallback poll takes over in the meantime. Nothing here retries by hand.
     */
    useEffect(() => {
        if (!target) return;

        const url = new URL(
            `${target.engine}/ui/api/sessions/${encodeURIComponent(target.sessionId)}/stream`
        );
        url.searchParams.set("k", target.token);

        const source = new EventSource(url.toString());

        source.onopen = () => {
            setStreaming(true);
        };

        source.onmessage = () => {
            setRevision((current) => current + 1);
        };

        source.onerror = () => {
            setStreaming(false);
        };

        return () => {
            source.close();
            setStreaming(false);
        };
    }, [target]);

    const runs = useMemo(() => orderRuns(sessionQuery.data?.runs ?? []), [sessionQuery.data?.runs]);

    /** Open a step's payloads in the inspector. */
    const inspectStep = useCallback(
        async (title: string, payloadIds: string[]) => {
            if (!target || payloadIds.length === 0) {
                setInspector({
                    title,
                    request: { info: "This step has no recorded payload yet." },
                    response: null,
                    loading: false,
                });
                return;
            }

            setInspector({ title, request: null, response: null, loading: true });

            try {
                const payloads = await Promise.all(
                    payloadIds.map((payloadId) =>
                        fetchPayload({
                            ...target,
                            sessionId: target.sessionId,
                            payloadId,
                        }).unwrap()
                    )
                );

                // One exchange can carry several payloads — a retried send, a
                // duplicate callback — so show the list when there is more than
                // one rather than silently picking the first.
                setInspector({
                    title,
                    request: payloads.length === 1 ? payloads[0].req : payloads.map((p) => p.req),
                    response:
                        payloads.length === 1
                            ? payloads[0].res.response
                            : payloads.map((p) => p.res.response),
                    loading: false,
                });
            } catch (error) {
                setInspector({
                    title,
                    request: { error: describe(error) },
                    response: null,
                    loading: false,
                });
            }
        },
        [target, fetchPayload]
    );

    return {
        target,
        session: sessionQuery.data?.session,
        flows: sessionQuery.data?.flows ?? [],
        runs,
        transactionIds: sessionQuery.data?.transaction_ids ?? [],
        isLoading: sessionQuery.isLoading,
        error: sessionQuery.error,
        inspector,
        setInspector,
        inspectStep,
        openRunId,
        setOpenRunId,
        revision,
    };
}

/** RTK Query wants an argument even when `skip` is set. */
function skip() {
    return { engine: "", token: "", sessionId: "" };
}

function describe(error: unknown): string {
    if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message?: unknown }).message);
    }
    return "Could not load this payload.";
}
