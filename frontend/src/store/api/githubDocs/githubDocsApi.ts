import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { DocMeta } from "@/types/apiShared/developerGuide";

const GITHUB_API_BASE =
    "https://api.github.com/repos/ONDC-Official/automation-framework/contents/docs/developer-docs";
const GITHUB_RAW_BASE =
    "https://raw.githubusercontent.com/ONDC-Official/automation-framework/main/docs/developer-docs";

interface GithubContentItem {
    name: string;
    type: "file" | "dir";
    download_url: string;
}

interface DocJsonMeta {
    label: string;
    short_description: string;
}

async function fetchGithubDocList(): Promise<DocMeta[]> {
    const res = await fetch(GITHUB_API_BASE);
    if (!res.ok) throw new Error("Failed to fetch doc list from GitHub");
    const items: unknown = await res.json();
    if (!Array.isArray(items)) {
        throw new Error("Unexpected GitHub doc list response");
    }

    const jsonFiles = items.filter(
        (f): f is GithubContentItem =>
            typeof f === "object" &&
            f !== null &&
            "type" in f &&
            (f as GithubContentItem).type === "file" &&
            "name" in f &&
            typeof (f as GithubContentItem).name === "string" &&
            (f as GithubContentItem).name.endsWith(".json") &&
            "download_url" in f &&
            typeof (f as GithubContentItem).download_url === "string"
    );

    const docs = await Promise.all(
        jsonFiles.map(async (file) => {
            const slug = file.name.replace(/\.json$/, "");
            const metaRes = await fetch(file.download_url);
            if (!metaRes.ok) return null;
            const meta: DocJsonMeta = await metaRes.json();
            return {
                slug,
                label: meta.label || slug,
                shortDescription: meta.short_description || "",
            } satisfies DocMeta;
        })
    );

    return docs.filter((d): d is DocMeta => d !== null);
}

async function fetchGithubDocContent(slug: string): Promise<string> {
    const res = await fetch(`${GITHUB_RAW_BASE}/${slug}.md`);
    if (!res.ok) throw new Error(`Failed to fetch doc content for: ${slug}`);
    return res.text();
}

export const githubDocsApi = createApi({
    reducerPath: "githubDocsApi",
    // External GitHub URLs — no app auth interceptor (see refactor plan B-2).
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    tagTypes: ["GithubDocList", "GithubDocContent"],
    // Docs are static per session — hold in the Redux cache for an hour so nav/content reads
    // are instant on revisit rather than re-hitting GitHub.
    keepUnusedDataFor: 60 * 60,
    endpoints: (builder) => ({
        getGithubDocList: builder.query<DocMeta[], void>({
            async queryFn() {
                try {
                    return { data: await fetchGithubDocList() };
                } catch (error) {
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            error: error instanceof Error ? error.message : String(error),
                        },
                    };
                }
            },
            providesTags: ["GithubDocList"],
        }),
        getGithubDocContent: builder.query<string, string>({
            async queryFn(slug) {
                try {
                    return { data: await fetchGithubDocContent(slug) };
                } catch (error) {
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            error: error instanceof Error ? error.message : String(error),
                        },
                    };
                }
            },
            providesTags: (_result, _err, slug) => [{ type: "GithubDocContent", id: slug }],
        }),
        getGithubSidebarDocContents: builder.query<Record<string, string>, string[]>({
            async queryFn(slugs) {
                const entries = await Promise.all(
                    slugs.map(async (slug) => {
                        try {
                            const content = await fetchGithubDocContent(slug);
                            return [slug, content] as const;
                        } catch {
                            return null;
                        }
                    })
                );

                return {
                    data: Object.fromEntries(
                        entries.filter(
                            (entry): entry is readonly [string, string] => entry !== null
                        )
                    ),
                };
            },
            providesTags: (_result, _err, slugs) =>
                slugs.map((slug) => ({ type: "GithubDocContent" as const, id: slug })),
        }),
    }),
});

export const {
    useGetGithubDocListQuery,
    useGetGithubDocContentQuery,
    useGetGithubSidebarDocContentsQuery,
} = githubDocsApi;

export default githubDocsApi;
