import { useEffect, useMemo, useState } from "react";
import {
    API_TYPES_FALLBACK_DTS_V2,
    generateApiTypesV2,
    generateSessionTypesV2,
    inferSessionSchemaV2,
    SESSION_TYPES_FALLBACK_DTS_V2,
    type SessionDataSchemaV2,
    type SessionInferenceFlowV2,
    type SessionInferenceReportV2,
    type SessionInferenceStepV2,
    type SpecDocumentV2,
} from "@ondc/automation-mock-runner";

import { useGetSpecQuery } from "@store/api";

/** The types step code is checked against, for one domain + version (+ use case). */
export interface SpecTypes {
    status: "loading" | "ready" | "unavailable";
    /** Why the spec types fell back to loose ones, when they did. */
    error?: string;
    /** `OndcApi.Payloads` + `Payload<A>`, or the loose fallback. */
    apiDts: string;
    /** `SessionData` + `SessionDataRaw`, or the loose fallback. */
    sessionDts: string;
    apiCount: number;
    /** The spec's use cases, plus any its published flows name. */
    usecases: string[];
    /** The use case `sessionData` is typed for; null = across all of them. */
    usecase: string | null;
    /** The session schema in use: inferred from the published flows (none is published yet). */
    session: { schema: SessionDataSchemaV2; report: SessionInferenceReportV2 } | null;
}

const LOOSE: Omit<SpecTypes, "status" | "usecases" | "usecase"> = {
    apiDts: API_TYPES_FALLBACK_DTS_V2,
    sessionDts: SESSION_TYPES_FALLBACK_DTS_V2,
    apiCount: 0,
    session: null,
};

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** The use case `hint` (e.g. the config's free-text `use_case_id`) names, if any. */
export const matchUsecase = (usecases: string[], hint?: string) => {
    if (hint) {
        const found = usecases.find((usecase) => normalize(usecase) === normalize(hint));
        if (found) return found;
    }
    return usecases.length === 1 ? usecases[0] : null;
};

/**
 * Types for Studio's step code, generated from the spec the developer guide
 * publishes (`include=meta`: the API JSON Schemas) and its published flows
 * (`include=flows`, already fetched for "Insert a published flow"):
 *
 * - every API's request payload → `Payload<"search">`;
 * - the session data of `usecase` → `SessionData`, inferred from the flows'
 *   `saveData` until session schemas are published with the spec. `null`
 *   infers across every use case.
 *
 * Falls back to loose types (`AnyPayload`, `Record<string, any>`) when the
 * spec can't be fetched, so typed templates always compile.
 */
export const useSpecTypes = (
    domain: string,
    version: string,
    {
        usecase: chosen,
        hint,
        graphSteps,
    }: {
        /** A picked use case; undefined picks one from `hint` (or the only one). */
        usecase?: string | null;
        /** Free text naming a use case, e.g. the config's `use_case_id`. */
        hint?: string;
        /**
         * The protocol graph's own steps (`api`, `action_id`, `saveData`), so
         * keys authored in Studio type `SessionData` too. Pass a settled value:
         * every change re-infers the schema.
         */
        graphSteps?: SessionInferenceStepV2[];
    } = {}
): SpecTypes => {
    const meta = useGetSpecQuery({ domain, version, include: ["meta"] });
    const flows = useGetSpecQuery({ domain, version, include: ["flows"] });

    const spec = useMemo<SpecDocumentV2 | null>(
        () =>
            meta.data?.paths
                ? ({
                      paths: meta.data.paths,
                      components: meta.data.components,
                      info: meta.data.info,
                  } as unknown as SpecDocumentV2)
                : null,
        [meta.data]
    );
    const flowEntries = flows.data?.["x-flows"];

    const usecases = useMemo(() => {
        const listed = meta.data?.info["x-usecases"] ?? [];
        const inFlows = (flowEntries ?? []).map((flow) => flow.usecase).filter(Boolean);
        return [...new Set([...listed, ...inFlows])].sort();
    }, [meta.data, flowEntries]);

    const usecase = chosen !== undefined ? chosen : matchUsecase(usecases, hint);

    const [types, setTypes] = useState<Omit<SpecTypes, "usecases" | "usecase">>({
        ...LOOSE,
        status: "loading",
    });

    useEffect(() => {
        if (meta.isLoading) return;
        if (!spec) {
            setTypes({
                ...LOOSE,
                status: "unavailable",
                error: meta.isError ? "Couldn't fetch the spec" : "The spec has no API schemas",
            });
            return;
        }
        let cancelled = false;
        (async () => {
            const api = await generateApiTypesV2(spec);
            let session: SpecTypes["session"] = null;
            let sessionDts = SESSION_TYPES_FALLBACK_DTS_V2;
            if (flowEntries || graphSteps?.length) {
                const flowsIn = [
                    ...(graphSteps?.length
                        ? [{ flowId: "studio", usecase: usecase ?? undefined, steps: graphSteps }]
                        : []),
                    ...((flowEntries ?? []) as unknown as SessionInferenceFlowV2[]),
                ];
                session = inferSessionSchemaV2({
                    spec,
                    flows: flowsIn,
                    domain,
                    version,
                    usecase: usecase ?? undefined,
                    tool: "Protocol Studio (inferred from published flows)",
                });
                sessionDts = (await generateSessionTypesV2(session.schema, spec)).dts;
            }
            if (cancelled) return;
            setTypes({
                status: "ready",
                apiDts: api.dts,
                sessionDts,
                apiCount: api.apis.length,
                session,
            });
        })().catch((e: unknown) => {
            if (cancelled) return;
            setTypes({
                ...LOOSE,
                status: "unavailable",
                error: `Couldn't generate types: ${e instanceof Error ? e.message : String(e)}`,
            });
        });
        return () => {
            cancelled = true;
        };
    }, [spec, flowEntries, graphSteps, meta.isLoading, meta.isError, domain, version, usecase]);

    return { ...types, usecases, usecase };
};

export default useSpecTypes;
