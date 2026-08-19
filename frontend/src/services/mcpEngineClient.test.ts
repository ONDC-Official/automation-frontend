// The same wrapper the code uses; `window.sessionStorage` is lint-banned so
// that all persistence goes through one place.
import { sessionStorage } from "@store/storage";
import {
    clearStoredMcpEngineTarget,
    initialMcpEngineTarget,
    parseMcpEngineTarget,
    readStoredMcpEngineTarget,
    storeMcpEngineTarget,
} from "@services/mcpEngineClient";

/**
 * The link parser is the security boundary of the MCP session viewer.
 *
 * Everything it returns is then used to build requests that carry a token, so
 * "what does it accept?" is the whole question. A link is a string somebody
 * sends you — it deserves the same suspicion as any other input from outside.
 */

const TOKEN = "engine-token";
const SESSION = "5c9a0d18-2f13-4c74-9d1a-a3b2f7c1e0aa";

function hash(params: Record<string, string>): string {
    return `#${new URLSearchParams(params).toString()}`;
}

describe("parseMcpEngineTarget", () => {
    it("reads engine, session and token out of a fragment", () => {
        const target = parseMcpEngineTarget(
            hash({ engine: "https://engine.example.com", session: SESSION, k: TOKEN })
        );

        expect(target).toEqual({
            engine: "https://engine.example.com",
            sessionId: SESSION,
            token: TOKEN,
        });
    });

    it("accepts a loopback engine, which is the ordinary case on a laptop", () => {
        const target = parseMcpEngineTarget(
            hash({ engine: "http://127.0.0.1:3000", session: SESSION, k: TOKEN })
        );

        expect(target?.engine).toBe("http://127.0.0.1:3000");
    });

    it("keeps a path, because an engine can sit behind a prefix", () => {
        const target = parseMcpEngineTarget(
            hash({ engine: "https://host.example.com/api-service/", session: SESSION, k: TOKEN })
        );

        // Trailing slash dropped, path kept — every request appends `/ui/api/…`.
        expect(target?.engine).toBe("https://host.example.com/api-service");
    });

    it.each([
        ["javascript:", "javascript:alert(1)"],
        ["data:", "data:text/html,<script>alert(1)</script>"],
        ["file:", "file:///etc/passwd"],
        ["not a URL at all", "engine.example.com"],
    ])("refuses a %s engine", (_label, engine) => {
        expect(parseMcpEngineTarget(hash({ engine, session: SESSION, k: TOKEN }))).toBeNull();
    });

    it("drops a query and fragment smuggled into the engine address", () => {
        // Without this, a crafted address would ride along on every request the
        // page then makes with a token attached.
        const target = parseMcpEngineTarget(
            hash({
                engine: "https://engine.example.com/?steal=1#x",
                session: SESSION,
                k: TOKEN,
            })
        );

        expect(target?.engine).toBe("https://engine.example.com");
    });

    it.each(["engine", "session", "k"])("returns null when %s is missing", (missing) => {
        const params: Record<string, string> = {
            engine: "https://engine.example.com",
            session: SESSION,
            k: TOKEN,
        };
        delete params[missing];

        expect(parseMcpEngineTarget(hash(params))).toBeNull();
    });

    it("returns null for an empty fragment, which is what a stripped link looks like", () => {
        // Chat clients and link unfurlers drop `#…` often enough that the page
        // has a state for it rather than an error.
        expect(parseMcpEngineTarget("")).toBeNull();
        expect(parseMcpEngineTarget("#")).toBeNull();
    });

    it("reads a fragment that arrives without its leading hash", () => {
        const target = parseMcpEngineTarget(
            new URLSearchParams({
                engine: "https://engine.example.com",
                session: SESSION,
                k: TOKEN,
            }).toString()
        );

        expect(target?.sessionId).toBe(SESSION);
    });
});

/**
 * Surviving a reload.
 *
 * The page clears the fragment as soon as it has read it, so from the second
 * load onwards this store *is* the link. Getting it wrong does not degrade the
 * page — it locks the reader out with "this link is incomplete", which is
 * exactly what shipped before these tests existed.
 */
describe("the remembered target", () => {
    const target = {
        engine: "http://127.0.0.1:3010",
        sessionId: SESSION,
        token: TOKEN,
    };

    beforeEach(async () => {
        await clearStoredMcpEngineTarget();
    });

    it("round-trips, which is what makes refresh work", async () => {
        await storeMcpEngineTarget(target);

        await expect(readStoredMcpEngineTarget()).resolves.toEqual(target);
    });

    it("is empty before anything has been stored", async () => {
        await expect(readStoredMcpEngineTarget()).resolves.toBeNull();
    });

    it("is forgotten on request", async () => {
        await storeMcpEngineTarget(target);
        await clearStoredMcpEngineTarget();

        await expect(readStoredMcpEngineTarget()).resolves.toBeNull();
    });

    it.each([
        ["a tampered scheme", { ...target, engine: "javascript:alert(1)" }],
        ["a smuggled query", { ...target, engine: "http://127.0.0.1:3010/?x=1" }],
        ["a missing token", { engine: target.engine, sessionId: SESSION }],
        ["a non-string token", { ...target, token: 42 }],
    ])("re-validates %s rather than trusting what it reads back", async (_label, stored) => {
        // Anything on this origin can write sessionStorage, so a value read out
        // of it deserves exactly the suspicion a URL gets.
        await sessionStorage.setItem("mcp-session-target", JSON.stringify(stored));

        const read = await readStoredMcpEngineTarget();

        if (_label === "a smuggled query") {
            expect(read?.engine).toBe("http://127.0.0.1:3010");
        } else {
            expect(read).toBeNull();
        }
    });

    it("survives a corrupted entry without throwing", async () => {
        await sessionStorage.setItem("mcp-session-target", "{not json");

        await expect(readStoredMcpEngineTarget()).resolves.toBeNull();
    });
});

/**
 * The starting state, which is where the reload bug actually lived.
 *
 * The first fix stored and restored the target correctly and the page *still*
 * said "this link is incomplete" on refresh, because the hook seeded its state
 * straight from the parser: a missing fragment gives `null`, `null` means
 * "definitely absent", and so the stored read was never reached. Every part
 * worked; the sentinel was inverted.
 */
describe("initialMcpEngineTarget", () => {
    it("is undefined when the link carries nothing, so the search continues", () => {
        // The assertion that matters. `toBeUndefined`, not `toBeNull` — and
        // `toBeFalsy` would have passed against the bug.
        expect(initialMcpEngineTarget("")).toBeUndefined();
        expect(initialMcpEngineTarget("#")).toBeUndefined();
    });

    it("is undefined for a link that is present but unusable", () => {
        // Also not `null`: a `javascript:` engine is somebody's bad link, not
        // evidence that this tab has no session open.
        expect(
            initialMcpEngineTarget(
                hash({ engine: "javascript:alert(1)", session: SESSION, k: TOKEN })
            )
        ).toBeUndefined();
    });

    it("is the target when the link carries one", () => {
        expect(
            initialMcpEngineTarget(
                hash({ engine: "http://127.0.0.1:3010", session: SESSION, k: TOKEN })
            )
        ).toEqual({ engine: "http://127.0.0.1:3010", sessionId: SESSION, token: TOKEN });
    });
});

/**
 * The reload, walked exactly as the hook walks it.
 *
 * Deliberately not `parse(...) ?? readStored(...)`: that composition is what the
 * first version of this file asserted, it passed, and the page was broken —
 * because the hook does not use `??`, it branches on the sentinel. Simulating
 * the logic I meant to write instead of the logic that runs is how the bug
 * survived its own tests.
 */
describe("the hook's resolution sequence", () => {
    const LINK = hash({ engine: "http://127.0.0.1:3010", session: SESSION, k: TOKEN });

    beforeEach(async () => {
        await clearStoredMcpEngineTarget();
    });

    /** What `useMcpSessionPage` does, minus React. */
    async function resolve(hashOnThisLoad: string) {
        const seeded = initialMcpEngineTarget(hashOnThisLoad);
        if (seeded === undefined) return (await readStoredMcpEngineTarget()) ?? null;
        await storeMcpEngineTarget(seeded);
        return seeded;
    }

    it("resolves from the link, then from memory after a refresh", async () => {
        const first = await resolve(LINK);
        expect(first).toEqual({
            engine: "http://127.0.0.1:3010",
            sessionId: SESSION,
            token: TOKEN,
        });

        // The hash is gone from here on — the page strips it.
        await expect(resolve("")).resolves.toEqual(first);
        await expect(resolve("")).resolves.toEqual(first);
    });

    it("still refuses when nothing was ever opened in this tab", async () => {
        await expect(resolve("")).resolves.toBeNull();
    });
});
