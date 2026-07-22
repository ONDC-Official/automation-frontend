import { useCallback, useMemo } from "react";
import { useGetBuildsQuery, useGetSpecQuery, useGetDocsQuery } from "@store/api";
import { getUsecaseLabelFromBuilds } from "../../utils";
import type { OpenAPISpecification, FlowEntry } from "../../types";

/**
 * Owns builds/spec/docs data for the resolved domain/version/use case route, plus the data
 * derived from the loaded spec (flows, error codes).
 *
 * Reads entirely from the RTK Query cache (which lives in Redux). The dev-guide endpoints are
 * configured with a long `keepUnusedDataFor`, so the first visit to a use case fetches once and
 * every subsequent visit/tab-switch resolves instantly from the store with no refetch or spinner.
 */
export function useSpecData(domainKey: string, versionKey: string, slug: string) {
    // `DeveloperGuideShell` blocks its `<Outlet/>` (this page) from mounting until builds have
    // resolved, so a second builds-loading flag here would always be false — only `data` is needed.
    const { data: builds = [] } = useGetBuildsQuery();

    const apiUsecase = useMemo(
        () => getUsecaseLabelFromBuilds(builds, domainKey, versionKey, slug) ?? slug,
        [builds, domainKey, versionKey, slug]
    );

    const hasRoute = Boolean(domainKey && versionKey);

    const {
        data: specFromQuery,
        isLoading: specLoading,
        isError: specError,
    } = useGetSpecQuery(
        {
            domain: domainKey,
            version: versionKey,
            include: ["meta", "flows", "attributes", "validations", "docs"],
            usecase: apiUsecase || undefined,
        },
        { skip: !hasRoute }
    );

    const specHasDocs = useMemo(() => {
        const existing = specFromQuery?.["x-docs"];
        return !!existing && Object.keys(existing).length > 0;
    }, [specFromQuery]);

    // Fallback: fetch docs separately only when the spec payload didn't include them.
    const { data: fallbackDocs } = useGetDocsQuery(
        { domain: domainKey, version: versionKey, usecase: apiUsecase || undefined },
        { skip: !hasRoute || !specFromQuery || specHasDocs }
    );

    const specData: OpenAPISpecification | null = useMemo(() => {
        if (!specFromQuery) return null;
        if (specHasDocs || !fallbackDocs || Object.keys(fallbackDocs).length === 0) {
            return specFromQuery;
        }
        return { ...specFromQuery, "x-docs": fallbackDocs };
    }, [specFromQuery, specHasDocs, fallbackDocs]);

    const isLoading = hasRoute && specLoading;
    const notFound = specError;

    const flows: FlowEntry[] = useMemo(() => specData?.["x-flows"] ?? [], [specData]);
    const errorCodes = specData?.["x-errorcodes"];
    const hasErrorCodes = !!errorCodes?.code?.length;

    const usecaseLabel = useMemo(() => {
        if (!builds.length) return null;
        return getUsecaseLabelFromBuilds(builds, domainKey, versionKey, slug);
    }, [builds, domainKey, versionKey, slug]);

    // Route changes are handled by arg-keyed cache selection — nothing to reset locally.
    const resetForNewRoute = useCallback(() => {}, []);

    return {
        specData,
        isLoading,
        notFound,
        flows,
        errorCodes,
        hasErrorCodes,
        apiUsecase,
        usecaseLabel,
        resetForNewRoute,
    };
}
