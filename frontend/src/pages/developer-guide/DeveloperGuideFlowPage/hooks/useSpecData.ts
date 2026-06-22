import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBuilds, fetchSpec, fetchDocs } from "@services/developerGuideSpecApi";
import { getUsecaseLabelFromBuilds } from "../../utils";
import type { OpenAPISpecification, FlowEntry, BuildEntry } from "../../types";

/**
 * Owns builds/spec/docs fetching for the resolved domain/version/use case route,
 * plus the data derived from the loaded spec (flows, error codes, supported actions).
 */
export function useSpecData(domainKey: string, versionKey: string, slug: string) {
    const [builds, setBuilds] = useState<BuildEntry[]>([]);
    const [specData, setSpecData] = useState<OpenAPISpecification | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const apiUsecase = useMemo(
        () => getUsecaseLabelFromBuilds(builds, domainKey, versionKey, slug) ?? slug,
        [builds, domainKey, versionKey, slug]
    );

    // Load builds then spec (resolve API usecase label from builds for correct flows/meta)
    useEffect(() => {
        if (!domainKey || !versionKey) return;

        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setNotFound(false);
            try {
                const buildsData = await fetchBuilds();
                if (cancelled) return;

                const resolvedUsecase =
                    getUsecaseLabelFromBuilds(buildsData, domainKey, versionKey, slug) ?? slug;

                const spec = await fetchSpec(domainKey, versionKey, {
                    include: ["meta", "flows", "attributes", "validations", "docs"],
                    usecase: resolvedUsecase || undefined,
                });

                if (cancelled) return;
                setBuilds(buildsData);
                setSpecData(spec);
            } catch {
                if (!cancelled) {
                    setBuilds([]);
                    setSpecData(null);
                    setNotFound(true);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [domainKey, versionKey, slug]);

    // Fallback: fetch docs separately if not included in spec payload
    useEffect(() => {
        if (isLoading || !domainKey || !versionKey || !specData) return;

        const existing = specData["x-docs"];
        if (existing && Object.keys(existing).length > 0) return;

        let cancelled = false;
        fetchDocs(domainKey, versionKey, { usecase: apiUsecase || undefined })
            .then((docs) => {
                if (cancelled || Object.keys(docs).length === 0) return;
                setSpecData((prev) => (prev ? { ...prev, "x-docs": docs } : prev));
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [isLoading, specData, domainKey, versionKey, apiUsecase]);

    const flows: FlowEntry[] = useMemo(() => specData?.["x-flows"] ?? [], [specData]);
    const errorCodes = specData?.["x-errorcodes"];
    const supportedActions = specData?.["x-supported-actions"];
    const hasErrorCodes = !!errorCodes?.code?.length;
    const hasSupportedActions =
        !!supportedActions && Object.keys(supportedActions.supportedActions ?? {}).length > 0;

    const usecaseLabel = useMemo(() => {
        if (!builds.length) return null;
        return getUsecaseLabelFromBuilds(builds, domainKey, versionKey, slug);
    }, [builds, domainKey, versionKey, slug]);

    const resetForNewRoute = useCallback(() => {
        setSpecData(null);
    }, []);

    return {
        specData,
        isLoading,
        notFound,
        flows,
        errorCodes,
        supportedActions,
        hasErrorCodes,
        hasSupportedActions,
        apiUsecase,
        usecaseLabel,
        resetForNewRoute,
    };
}
