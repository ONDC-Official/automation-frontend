import type { DocMeta } from "@pages/developer-guide/types";

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
    description?: string;
}

export async function fetchDocList(): Promise<DocMeta[]> {
    const res = await fetch(GITHUB_API_BASE);
    if (!res.ok) throw new Error("Failed to fetch doc list from GitHub");
    const items: GithubContentItem[] = await res.json();

    const jsonFiles = items.filter((f) => f.type === "file" && f.name.endsWith(".json"));

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

export async function fetchDocContent(slug: string): Promise<string> {
    const res = await fetch(`${GITHUB_RAW_BASE}/${slug}.md`);
    if (!res.ok) throw new Error(`Failed to fetch doc content for: ${slug}`);
    return res.text();
}
