import { parseDocument } from "yaml";

/**
 * The published contract files, read from the specs repo on GitHub: one
 * branch per domain + version. Branch heads come from the API (one call);
 * files come raw, pinned to a commit, so they're immutable and cacheable.
 */

export const SPEC_REPO = "ONDC-Official/automation-specifications";
const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";

export type ContractFileId = "actions" | "validations" | "specs";

export const CONTRACT_FILE_IDS: ContractFileId[] = ["actions", "validations", "specs"];

/** Where each file lives when `config/index.yaml` doesn't say. */
export const DEFAULT_CONTRACT_PATHS: Record<ContractFileId, string> = {
    actions: "config/actions/index.yaml",
    validations: "config/validations/index.yaml",
    specs: "config/specs/openapi.yaml",
};

export interface SpecRef {
    branch: string;
    sha: string;
}

export class GithubError extends Error {
    constructor(
        message: string,
        readonly code: "rate-limited" | "not-found" | "network" | "http",
        readonly resetAt?: Date
    ) {
        super(message);
    }
}

const timeOf = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const toGithubError = (
    res: Pick<Response, "status" | "headers">,
    what: string
): GithubError => {
    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = res.headers.get("x-ratelimit-reset");
    const retryAfter = res.headers.get("retry-after");
    if ((res.status === 403 || res.status === 429) && (remaining === "0" || retryAfter)) {
        const resetAt = reset
            ? new Date(Number(reset) * 1000)
            : new Date(Date.now() + Number(retryAfter ?? 60) * 1000);
        return new GithubError(
            `GitHub's rate limit is used up; it resets at ${timeOf(resetAt)}.`,
            "rate-limited",
            resetAt
        );
    }
    if (res.status === 404) return new GithubError(`${what} isn't on this branch.`, "not-found");
    return new GithubError(`GitHub answered ${res.status} for ${what}.`, "http");
};

const request = async (url: string, what: string, init?: RequestInit) => {
    let res: Response;
    try {
        res = await fetch(url, init);
    } catch {
        throw new GithubError("Couldn't reach GitHub. Check the connection.", "network");
    }
    if (!res.ok) throw toGithubError(res, what);
    return res;
};

/** Every branch of the specs repo with its head commit (one API call, no pagination). */
export const fetchSpecRefs = async (repo = SPEC_REPO): Promise<SpecRef[]> => {
    const res = await request(`${API}/repos/${repo}/git/matching-refs/heads/`, "The branch list", {
        headers: { Accept: "application/vnd.github+json" },
    });
    const refs = (await res.json()) as { ref: string; object: { sha: string } }[];
    return refs
        .filter((r) => r.ref.startsWith("refs/heads/"))
        .map((r) => ({ branch: r.ref.slice("refs/heads/".length), sha: r.object.sha }));
};

/** Decodes bytes as UTF-8 keeping a BOM, so an untouched file exports byte for byte. */
export const decodeText = (bytes: ArrayBuffer) =>
    new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);

/** A file's raw text at a commit (or branch name, when no commit is known). */
export const fetchRawFile = async (repo: string, ref: string, path: string): Promise<string> => {
    const res = await request(
        `${RAW}/${repo}/${encodeURIComponent(ref).replace(/%2F/g, "/")}/${path}`,
        path
    );
    return decodeText(await res.arrayBuffer());
};

/**
 * The three files' paths, from `config/index.yaml`'s `$ref`s
 * (`x-supported-actions`, `x-validations`, `paths`), relative to `config/`.
 */
export const resolveContractPaths = (indexYaml: string | null): Record<ContractFileId, string> => {
    const paths = { ...DEFAULT_CONTRACT_PATHS };
    if (!indexYaml) return paths;
    let index: Record<string, unknown> | null = null;
    try {
        index = parseDocument(indexYaml, { logLevel: "silent" }).toJS() as Record<
            string,
            unknown
        > | null;
    } catch {
        return paths;
    }
    const refOf = (key: string) => {
        const value = index?.[key];
        const ref =
            value && typeof value === "object" ? (value as { $ref?: unknown }).$ref : undefined;
        if (typeof ref !== "string") return undefined;
        const file = ref.split("#")[0]?.trim();
        if (!file) return undefined;
        const parts = ["config", ...file.split("/")].filter((part) => part !== "." && part !== "");
        const out: string[] = [];
        for (const part of parts) {
            if (part === "..") out.pop();
            else out.push(part);
        }
        return out.join("/");
    };
    paths.actions = refOf("x-supported-actions") ?? paths.actions;
    paths.validations = refOf("x-validations") ?? paths.validations;
    paths.specs = refOf("paths") ?? paths.specs;
    return paths;
};

/** `ONDC:TRV11` → `TRV11`; `ONDC:FIS12:PF` → `FIS12-PF`. */
export const domainSlug = (domain: string) => domain.replace(/^ONDC:/i, "").replace(/:/g, "-");

export interface RankedBranch extends SpecRef {
    score: number;
    label: "release" | "draft" | "spec" | "match";
}

/**
 * Branches for a domain + version, best first: the spec's own `x-branch-name`,
 * then `release-eks-<D>-<v>`, `draft-<D>-<v>`, then anything naming both.
 */
export const rankBranches = (
    refs: SpecRef[],
    domain: string,
    version: string,
    hint?: string
): RankedBranch[] => {
    const slug = domainSlug(domain).toLowerCase();
    const v = version.toLowerCase();
    const ranked: RankedBranch[] = [];
    for (const ref of refs) {
        const name = ref.branch.toLowerCase();
        let score = 0;
        let label: RankedBranch["label"] = "match";
        if (name === `release-eks-${slug}-${v}`) {
            score = 90;
            label = "release";
        } else if (name === `draft-${slug}-${v}`) {
            score = 80;
            label = "draft";
        } else if (name.includes(slug) && name.includes(v)) {
            score = 50;
            label = name.startsWith("release")
                ? "release"
                : name.startsWith("draft")
                  ? "draft"
                  : "match";
        } else if (name.includes(slug)) {
            score = 20;
        }
        if (hint && ref.branch === hint) {
            score = Math.max(score, 100);
            label = label === "match" ? "spec" : label;
        }
        if (score > 0) ranked.push({ ...ref, score, label });
    }
    return ranked.sort((a, b) => b.score - a.score || a.branch.localeCompare(b.branch));
};

/**
 * The branch to import by default: the spec's own hint, else release, else
 * draft. The hint says `draft-…` even on some release builds, so the picker
 * shows every candidate with its label.
 */
export const pickDefaultBranch = (ranked: RankedBranch[]): RankedBranch | undefined => ranked[0];

export interface FetchedContracts {
    repo: string;
    branch: string;
    sha: string;
    paths: Record<ContractFileId, string>;
    texts: Partial<Record<ContractFileId, string>>;
    missing: ContractFileId[];
}

/** `config/index.yaml`, then the three files, all at one commit. */
export const fetchContracts = async (
    repo: string,
    branch: string,
    sha: string
): Promise<FetchedContracts> => {
    const ref = sha || branch;
    let index: string | null = null;
    try {
        index = await fetchRawFile(repo, ref, "config/index.yaml");
    } catch (e) {
        if (!(e instanceof GithubError) || e.code !== "not-found") throw e;
    }
    const paths = resolveContractPaths(index);
    const texts: Partial<Record<ContractFileId, string>> = {};
    const missing: ContractFileId[] = [];
    await Promise.all(
        CONTRACT_FILE_IDS.map(async (id) => {
            try {
                texts[id] = await fetchRawFile(repo, ref, paths[id]);
            } catch (e) {
                if (e instanceof GithubError && e.code === "not-found") missing.push(id);
                else throw e;
            }
        })
    );
    return { repo, branch, sha, paths, texts, missing };
};
