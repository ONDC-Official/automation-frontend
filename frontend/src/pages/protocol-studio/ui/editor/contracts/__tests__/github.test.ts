import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from "util";

import {
    decodeText,
    domainSlug,
    fetchContracts,
    fetchSpecRefs,
    pickDefaultBranch,
    rankBranches,
    resolveContractPaths,
    toGithubError,
    type SpecRef,
} from "@pages/protocol-studio/ui/editor/contracts/github";
import {
    detectContractKind,
    endpointText,
} from "@pages/protocol-studio/ui/editor/contracts/endpoint";
import { fnv1a, matchesBase } from "@pages/protocol-studio/ui/editor/contracts/hash";
import studioContractsSlice, {
    contractSetKey,
    importContractSet,
    persistedContractChars,
    revertContractFile,
    setContractFileText,
    uploadContractFile,
} from "@store/slices/studioContractsSlice";

// jsdom has neither; the browser and Node do.
Object.assign(globalThis, { TextDecoder: NodeTextDecoder, TextEncoder: NodeTextEncoder });

const refs: SpecRef[] = [
    "draft-TRV11-2.0.1",
    "draft-TRV11-2.1.0",
    "release-eks-TRV11-2.1.0",
    "release-eks-TRV10-2.1.0",
    "fix/trv11-2.0.1",
    "feat/mockServicesTRV112.1.0",
    "draft-FIS12-PF-2.3.0",
].map((branch, i) => ({ branch, sha: `sha${i}` }));

const headers = (entries: Record<string, string>) => new Headers(entries);

describe("specs repo: branches", () => {
    it("slugs domains", () => {
        expect(domainSlug("ONDC:TRV11")).toBe("TRV11");
        expect(domainSlug("ONDC:FIS12:PF")).toBe("FIS12-PF");
    });

    it("ranks the spec's hint, then release, then draft, then anything naming both", () => {
        const ranked = rankBranches(refs, "ONDC:TRV11", "2.1.0", "draft-TRV11-2.1.0");
        expect(ranked.map((r) => [r.branch, r.label])).toEqual([
            ["draft-TRV11-2.1.0", "draft"],
            ["release-eks-TRV11-2.1.0", "release"],
            ["feat/mockServicesTRV112.1.0", "match"],
            ["draft-TRV11-2.0.1", "match"],
            ["fix/trv11-2.0.1", "match"],
        ]);
        expect(pickDefaultBranch(ranked)?.branch).toBe("draft-TRV11-2.1.0");
        expect(pickDefaultBranch(rankBranches(refs, "ONDC:TRV11", "2.1.0"))?.branch).toBe(
            "release-eks-TRV11-2.1.0"
        );
        expect(rankBranches(refs, "ONDC:FIS12:PF", "2.3.0")[0]?.branch).toBe(
            "draft-FIS12-PF-2.3.0"
        );
    });

    it("lists every branch with one call", async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                { ref: "refs/heads/main", object: { sha: "a" } },
                { ref: "refs/heads/draft-TRV11-2.1.0", object: { sha: "b" } },
            ],
        });
        global.fetch = fetchMock as unknown as typeof fetch;
        await expect(fetchSpecRefs()).resolves.toEqual([
            { branch: "main", sha: "a" },
            { branch: "draft-TRV11-2.1.0", sha: "b" },
        ]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain("/git/matching-refs/heads/");
    });
});

describe("specs repo: files", () => {
    it("reads the three paths from config/index.yaml's $refs", () => {
        const index = [
            "paths:",
            "  $ref: ./specs/openapi.yaml#/paths",
            "x-validations:",
            "  $ref: ./validations/v2.yaml",
            "x-supported-actions:",
            "  $ref: ../shared/actions.yaml",
        ].join("\n");
        expect(resolveContractPaths(index)).toEqual({
            actions: "shared/actions.yaml",
            validations: "config/validations/v2.yaml",
            specs: "config/specs/openapi.yaml",
        });
        expect(resolveContractPaths(null).validations).toBe("config/validations/index.yaml");
        expect(resolveContractPaths("not: [valid").actions).toBe("config/actions/index.yaml");
    });

    it("keeps a BOM, so an untouched file exports byte for byte", () => {
        const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x3a, 0x20, 0x31]);
        const text = decodeText(bytes.buffer);
        expect(text.charCodeAt(0)).toBe(0xfeff);
        expect(text.slice(1)).toBe("a: 1");
    });

    it("explains rate limits and missing files", () => {
        const limited = toGithubError(
            {
                status: 403,
                headers: headers({
                    "x-ratelimit-remaining": "0",
                    "x-ratelimit-reset": "1893456000",
                }),
            },
            "x"
        );
        expect(limited.code).toBe("rate-limited");
        expect(limited.message).toMatch(/resets at/);
        expect(toGithubError({ status: 404, headers: headers({}) }, "config/x.yaml").message).toBe(
            "config/x.yaml isn't on this branch."
        );
        expect(toGithubError({ status: 500, headers: headers({}) }, "x").code).toBe("http");
    });

    it("fetches the files at one commit, noting the missing ones", async () => {
        const files: Record<string, string> = {
            "config/index.yaml": "x-validations:\n  $ref: ./validations/index.yaml\n",
            "config/validations/index.yaml": "_TESTS_: {}\n",
            "config/specs/openapi.yaml": "paths: {}\n",
        };
        global.fetch = jest.fn(async (url: string) => {
            const path = Object.keys(files).find((p) => url.endsWith(`/abc123/${p}`));
            return path
                ? {
                      ok: true,
                      arrayBuffer: async () => new TextEncoder().encode(files[path]).buffer,
                  }
                : { ok: false, status: 404, headers: headers({}) };
        }) as unknown as typeof fetch;
        const result = await fetchContracts("o/r", "draft-X", "abc123");
        expect(result.texts.validations).toBe("_TESTS_: {}\n");
        expect(result.texts.specs).toBe("paths: {}\n");
        expect(result.missing).toEqual(["actions"]);
    });
});

describe("contract files", () => {
    it("tells uploads apart by their keys", () => {
        expect(detectContractKind("_TESTS_:\n  search: []\n")).toBe("validations");
        expect(detectContractKind("supportedActions:\n  search: [on_search]\n")).toBe("actions");
        expect(detectContractKind("openapi: 3.0.0\npaths: {}\n")).toBe("specs");
        expect(detectContractKind("hello: world\n")).toBeNull();
    });

    it("renders the spec service's copy as read-only YAML", () => {
        const text = endpointText(
            { "x-supported-actions": { supportedActions: { null: ["search"] } } },
            "actions"
        );
        expect(text).toMatch(/^# Generated by Studio/);
        expect(text).toContain("supportedActions:");
        expect(endpointText({}, "validations")).toBeUndefined();
    });

    it("hashes text to know when it is the base again", () => {
        const base = "a: 1\n";
        expect(matchesBase(base, { baseHash: fnv1a(base), baseSize: base.length })).toBe(true);
        expect(matchesBase("a: 2\n", { baseHash: fnv1a(base), baseSize: base.length })).toBe(false);
    });
});

describe("studioContracts slice", () => {
    const reducer = studioContractsSlice.reducer;
    const key = contractSetKey("ONDC:TRV11", "2.1.0");
    const imported = reducer(
        undefined,
        importContractSet({
            domain: "ONDC:TRV11",
            version: "2.1.0",
            source: {
                kind: "github",
                repo: "o/r",
                branch: "draft-TRV11-2.1.0",
                sha: "abc",
                importedAt: "now",
            },
            files: {
                actions: { path: "config/actions/index.yaml", baseHash: "h1", baseSize: 10 },
                validations: {
                    path: "config/validations/index.yaml",
                    baseHash: "h2",
                    baseSize: 20,
                },
            },
        })
    );

    it("stores no text for an import, only where it came from", () => {
        expect(imported.sets[key]?.files.validations).toEqual({
            path: "config/validations/index.yaml",
            hasBase: true,
            baseHash: "h2",
            baseSize: 20,
        });
        expect(persistedContractChars({ studioContracts: imported })).toBe(0);
    });

    it("stores edited text, and drops it when it matches the base again", () => {
        const edited = reducer(
            imported,
            setContractFileText({ key, file: "validations", text: "edited" })
        );
        expect(edited.sets[key]?.files.validations?.text).toBe("edited");
        expect(persistedContractChars({ studioContracts: edited })).toBe(6);
        const clean = reducer(
            edited,
            setContractFileText({ key, file: "validations", text: null })
        );
        expect(clean.sets[key]?.files.validations?.text).toBeUndefined();
    });

    it("keeps uploads, and reverting one goes back to the GitHub base", () => {
        const uploaded = reducer(
            imported,
            uploadContractFile({
                domain: "ONDC:TRV11",
                version: "2.1.0",
                file: "actions",
                fileName: "a.yaml",
                text: "x",
            })
        );
        expect(uploaded.sets[key]?.files.actions).toMatchObject({
            hasBase: true,
            uploadedAs: "a.yaml",
            text: "x",
        });
        const reverted = reducer(uploaded, revertContractFile({ key, file: "actions" }));
        expect(reverted.sets[key]?.files.actions?.text).toBeUndefined();
        const onlyUpload = reducer(
            undefined,
            uploadContractFile({
                domain: "D",
                version: "1",
                file: "specs",
                fileName: "o.yaml",
                text: "paths: {}",
            })
        );
        const dropped = reducer(
            onlyUpload,
            revertContractFile({ key: contractSetKey("D", "1"), file: "specs" })
        );
        expect(dropped.sets[contractSetKey("D", "1")]?.files.specs).toBeUndefined();
    });
});
