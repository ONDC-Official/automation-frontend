import { API_ROUTES } from "@services/apiRoutes";
import type {
    BuildEntry,
    SpecResponse,
    OpenAPISpecification,
    FlowEntry,
    ValidationTableSection,
    ChangelogEntry,
} from "@/types/apiShared/developerGuide";
import { mainApi } from "@store/api/main/mainApi";
import type { IGetSpecParams } from "./types";

const buildSpecQuery = ({ domain, version, ...options }: IGetSpecParams) => {
    const params: Record<string, string> = {};

    if (options.include?.length) {
        params.include = options.include.join(",");
    }
    if (options.usecase) params.usecase = options.usecase;
    if (options.flowId) params.flowId = options.flowId;
    if (options.tag) params.tag = options.tag;
    if (options.docSlug) params.docSlug = options.docSlug;

    return {
        url: API_ROUTES.DEV_GUIDE.SPEC(domain, version),
        method: "GET" as const,
        params,
    };
};

// ─── Transform helpers (moved verbatim from services/developerGuideSpecApi.ts) ───

function specResponseToOpenAPI(
    raw: SpecResponse,
    domain: string,
    version: string
): OpenAPISpecification {
    const meta = (raw.meta ?? {}) as Record<string, unknown>;

    const flows: FlowEntry[] | undefined = raw.flows?.map((f) => ({
        domain: str(f.domain, domain),
        version: str(f.version, version),
        type: str(f.type, "playground"),
        flowId: str(f.flowId, ""),
        usecase: str(f.usecase, ""),
        tags: Array.isArray(f.tags) ? f.tags : [],
        description: str(f.description, ""),
        config: f.config ?? { steps: [] },
    }));

    // API returns attributeSet (camelCase); frontend expects attribute_set
    const attributes = raw.attributes?.map((a) => ({
        meta: { use_case_id: a.useCaseId },
        attribute_set: a.attributeSet,
    }));

    // API returns docs as array of { slug, content, order }
    const docs: Record<string, string> | undefined = raw.docs?.length
        ? Object.fromEntries(
              raw.docs
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((d) => [d.slug, d.content])
          )
        : undefined;

    // API returns meta.errorCodes as flat array (camelCase, no x- prefix)
    const rawErrorCodes = meta.errorCodes as
        | Array<{ Event: string; Description: string; From: string; code: string | number }>
        | undefined;

    // API returns meta.supportedActions and meta.apiProperties as separate fields
    const rawSupportedActions = meta.supportedActions as Record<string, string[]> | undefined;
    const rawApiProperties = meta.apiProperties as
        | Record<string, { async_predecessor: string | null; transaction_partner: string[] }>
        | undefined;

    // Validations section: API returns { validations: unknown } wrapper
    const rawValidations = raw.validations?.validations;

    return {
        openapi: str(meta.openapi, "3.0.0"),
        info: {
            title: str(meta.title, ""),
            description: str(meta.description, ""),
            version: str(meta.version, version),
            domain: str(meta.domain, domain),
            "x-usecases": asStringArray(meta.usecases),
            "x-branch-name": str(meta.branchName, undefined),
            "x-reporting": typeof meta.reporting === "boolean" ? meta.reporting : undefined,
        },
        paths: (meta.paths as OpenAPISpecification["paths"]) ?? undefined,
        components: (meta.components as OpenAPISpecification["components"]) ?? undefined,
        security: (meta.security as OpenAPISpecification["security"]) ?? undefined,
        "x-flows": flows,
        "x-attributes": attributes,
        "x-validations": rawValidations
            ? (rawValidations as OpenAPISpecification["x-validations"])
            : undefined,
        "x-errorcodes": rawErrorCodes?.length ? { code: rawErrorCodes } : undefined,
        "x-supported-actions":
            rawSupportedActions && Object.keys(rawSupportedActions).length > 0
                ? {
                      supportedActions: rawSupportedActions,
                      apiProperties: rawApiProperties ?? {},
                  }
                : undefined,
        "x-docs": docs,
    };
}

function str(v: unknown, fallback: string): string;
function str(v: unknown, fallback: undefined): string | undefined;
function str(v: unknown, fallback: string | undefined): string | undefined {
    return typeof v === "string" ? v : fallback;
}

function asStringArray(v: unknown): string[] | undefined {
    return Array.isArray(v) ? v.filter((i): i is string => typeof i === "string") : undefined;
}

// Developer Guide reference data (builds/specs/docs/changelog) is effectively immutable for a
// session. Keep it resident in the Redux (RTK Query) cache for an hour so navigating between
// use-cases and tabs reads straight from the store with no refetch or spinner.
const DEV_GUIDE_CACHE_SECONDS = 60 * 60;

export const specApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        getBuilds: builder.query<BuildEntry[], void>({
            query: () => ({
                url: API_ROUTES.DEV_GUIDE.BUILDS,
                method: "GET",
            }),
            transformResponse: (response: BuildEntry[]) => response ?? [],
            providesTags: ["Build"],
            keepUnusedDataFor: DEV_GUIDE_CACHE_SECONDS,
        }),
        getSpec: builder.query<OpenAPISpecification, IGetSpecParams>({
            query: buildSpecQuery,
            transformResponse: (raw: SpecResponse, _meta, arg) =>
                specResponseToOpenAPI(raw, arg.domain, arg.version),
            providesTags: ["Spec"],
            keepUnusedDataFor: DEV_GUIDE_CACHE_SECONDS,
        }),
        getValidationTable: builder.query<
            ValidationTableSection | null,
            { domain: string; version: string }
        >({
            query: ({ domain, version }) =>
                buildSpecQuery({ domain, version, include: ["validationTable"] }),
            transformResponse: (raw: SpecResponse) =>
                (raw.validationTable as ValidationTableSection) ?? null,
            providesTags: ["ValidationTable"],
            keepUnusedDataFor: DEV_GUIDE_CACHE_SECONDS,
        }),
        getChangelog: builder.query<ChangelogEntry[], { domain: string; version: string }>({
            query: ({ domain, version }) =>
                buildSpecQuery({ domain, version, include: ["changelog"] }),
            transformResponse: (raw: SpecResponse) =>
                (raw.changelog as ChangelogEntry[] | undefined) ?? [],
            providesTags: ["Changelog"],
            keepUnusedDataFor: DEV_GUIDE_CACHE_SECONDS,
        }),
        getDocs: builder.query<
            Record<string, string>,
            { domain: string; version: string; docSlug?: string; usecase?: string }
        >({
            query: ({ domain, version, docSlug, usecase }) =>
                buildSpecQuery({
                    domain,
                    version,
                    include: ["docs"],
                    ...(docSlug ? { docSlug } : {}),
                    ...(usecase ? { usecase } : {}),
                }),
            transformResponse: (raw: SpecResponse) => {
                if (!raw.docs?.length) return {};
                return Object.fromEntries(
                    raw.docs
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((d) => [d.slug, d.content])
                );
            },
            providesTags: ["Docs"],
            keepUnusedDataFor: DEV_GUIDE_CACHE_SECONDS,
        }),
    }),
});

export const {
    useGetBuildsQuery,
    useLazyGetBuildsQuery,
    useGetSpecQuery,
    useLazyGetSpecQuery,
    useGetValidationTableQuery,
    useGetChangelogQuery,
    useGetDocsQuery,
    useLazyGetDocsQuery,
} = specApi;
