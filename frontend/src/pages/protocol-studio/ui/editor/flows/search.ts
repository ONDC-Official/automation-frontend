import { ACTION_FILE_IDS } from "@pages/protocol-studio/ui/editor/flows/action-files";
import type {
    CodeFileId,
    SearchFileResult,
    SearchMatch,
    SearchOptions,
    SearchOutcome,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/** Enough to find anything; more would only slow the panel down. */
export const SEARCH_MATCH_LIMIT = 1000;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findMatches = (source: string, pattern: RegExp, budget: number): SearchMatch[] => {
    const matches: SearchMatch[] = [];
    const lines = source.split("\n");
    for (let i = 0; i < lines.length && matches.length < budget; i += 1) {
        const text = lines[i];
        pattern.lastIndex = 0;
        let match = pattern.exec(text);
        while (match && matches.length < budget) {
            if (match[0].length === 0) {
                // An empty match (e.g. `^` or `a*`) would never advance; skip past it.
                pattern.lastIndex += 1;
            } else {
                matches.push({
                    line: i + 1,
                    column: match.index,
                    length: match[0].length,
                    text,
                });
            }
            match = pattern.exec(text);
        }
    }
    return matches;
};

/**
 * Searches every node's files and the config's helpers.ts, like a code
 * editor's find-in-files. Results come back grouped by file, in graph order.
 */
export const searchNodes = (
    nodes: StudioNode[],
    helpers: string,
    { query, matchCase, regex }: SearchOptions
): SearchOutcome => {
    if (query === "") return { results: [], total: 0, truncated: false };

    let pattern: RegExp;
    try {
        pattern = new RegExp(regex ? query : escapeRegExp(query), matchCase ? "g" : "gi");
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { results: [], total: 0, truncated: false, error: message };
    }

    const results: SearchFileResult[] = [];
    let total = 0;
    const add = (
        key: string,
        tab: CodeFileId,
        location: string,
        source: string,
        nodeId?: string
    ) => {
        const matches = findMatches(source, pattern, SEARCH_MATCH_LIMIT - total);
        if (matches.length === 0) return;
        results.push({ key, nodeId, tab, location, matches });
        total += matches.length;
    };

    for (const node of nodes) {
        const location = node.id === node.api ? node.id : `${node.id} · ${node.api}`;
        if (node.decision) {
            if (total < SEARCH_MATCH_LIMIT) {
                add(`${node.id}:decide`, "decide", node.id, node.decision.decide, node.id);
            }
            continue;
        }
        for (const file of ACTION_FILE_IDS) {
            if (total >= SEARCH_MATCH_LIMIT) break;
            add(`${node.id}:${file}`, file, location, node.files[file], node.id);
        }
    }
    if (total < SEARCH_MATCH_LIMIT) add("config:helpers", "helpers", "Config", helpers);

    return { results, total, truncated: total >= SEARCH_MATCH_LIMIT };
};
