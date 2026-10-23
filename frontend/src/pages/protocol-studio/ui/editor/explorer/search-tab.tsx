import { useDeferredValue, useEffect, useMemo, useRef } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import { CODE_DIALOG_FILES } from "@pages/protocol-studio/ui/editor/constants";
import { SNIPPET_LEAD } from "@pages/protocol-studio/ui/editor/explorer/constants";
import { SEARCH_MATCH_LIMIT, searchNodes } from "@pages/protocol-studio/ui/editor/flows/search";
import {
    DECISION_TABS,
    getInspectorTabs,
} from "@pages/protocol-studio/ui/editor/inspector/constants";
import type {
    CodeFileId,
    HeroIcon,
    ISearchTabProps,
    SearchMatch,
    SearchOptions,
    SearchOutcome,
} from "@pages/protocol-studio/ui/editor/types";

type FileLabel = { label: string; Icon: HeroIcon };

/** Label and icon per searched file, by language: the inspector's tabs, plus helpers.ts from the header. */
const FILES_BY_LANGUAGE = {
    typescript: new Map<CodeFileId, FileLabel>([
        ...[...getInspectorTabs("typescript"), ...DECISION_TABS].map(
            (tab) => [tab.id, tab] as const
        ),
        ["helpers", CODE_DIALOG_FILES.helpers],
    ]),
    javascript: new Map<CodeFileId, FileLabel>([
        ...[...getInspectorTabs("javascript"), ...DECISION_TABS].map(
            (tab) => [tab.id, tab] as const
        ),
        ["helpers", CODE_DIALOG_FILES.helpers],
    ]),
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const getSummary = (options: SearchOptions, outcome: SearchOutcome, nodeCount: number) => {
    if (outcome.error) return `Invalid regular expression: ${outcome.error}`;
    if (options.query === "") {
        return nodeCount === 0
            ? "Only helpers.ts so far: add a node to search its code."
            : `Searches every file of ${plural(nodeCount, "node")}, plus helpers.ts.`;
    }
    if (outcome.total === 0) return "No results.";
    const found = `${plural(outcome.total, "result")} in ${plural(outcome.results.length, "file")}`;
    return outcome.truncated ? `${found}, stopped at the first ${SEARCH_MATCH_LIMIT}` : found;
};

/** The line around a match, with the match marked. Leading indentation is dropped. */
const Snippet = ({ match }: { match: SearchMatch }) => {
    const start = Math.max(0, match.column - SNIPPET_LEAD);
    const lead = match.text.slice(start, match.column);
    const before = start > 0 ? `…${lead}` : lead.trimStart();
    const end = match.column + match.length;
    return (
        <>
            {before}
            <mark className="studio-result-mark">{match.text.slice(match.column, end)}</mark>
            {match.text.slice(end, end + 160)}
        </>
    );
};

/**
 * Find in files: every node's code and data, plus helpers.ts. Results are
 * grouped by file; opening one selects its node and highlights the match in
 * the inspector.
 */
export const SearchTab = ({
    nodes,
    helpers,
    options,
    onOptionsChange,
    onOpenMatch,
}: ISearchTabProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const deferred = useDeferredValue(options);
    const outcome = useMemo(
        () => searchNodes(nodes, helpers, deferred),
        [nodes, helpers, deferred]
    );
    const nodeCount = nodes.length;
    const set = (patch: Partial<SearchOptions>) => onOptionsChange({ ...options, ...patch });

    // Focus once the click that opened the tab is done: its mousedown would
    // otherwise hand focus straight back to the tab trigger.
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const openFirst = () => {
        const first = outcome.results[0];
        if (first) onOpenMatch(first, first.matches[0]);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="px-3 pt-2.5 pb-2">
                <div className="studio-search">
                    <MagnifyingGlassIcon aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="studio-search-input"
                        value={options.query}
                        onChange={(e) => set({ query: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") openFirst();
                            else if (e.key === "Escape" && options.query) set({ query: "" });
                        }}
                        placeholder="Search code"
                        aria-label="Search code in every node"
                        spellCheck={false}
                        autoComplete="off"
                    />
                    <button
                        type="button"
                        className="studio-toggle"
                        aria-pressed={options.matchCase}
                        onClick={() => set({ matchCase: !options.matchCase })}
                        title="Match case"
                    >
                        Aa
                    </button>
                    <button
                        type="button"
                        className="studio-toggle"
                        aria-pressed={options.regex}
                        onClick={() => set({ regex: !options.regex })}
                        title="Use regular expression"
                    >
                        .*
                    </button>
                </div>
                <p
                    className="studio-search-summary"
                    data-error={outcome.error ? true : undefined}
                    aria-live="polite"
                >
                    {getSummary(options, outcome, nodeCount)}
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-1.5 pb-2">
                {outcome.results.map((result) => {
                    const language =
                        nodes.find((node) => node.id === result.nodeId)?.codeLanguage ??
                        "typescript";
                    const tab = FILES_BY_LANGUAGE[language].get(result.tab);
                    const Icon = tab?.Icon;
                    return (
                        <section key={result.key} className="studio-result">
                            <header
                                className="studio-result-head"
                                title={`${result.location} › ${tab?.label}`}
                            >
                                {Icon ? <Icon /> : null}
                                <span className="studio-mono shrink-0">{tab?.label}</span>
                                <span className="studio-result-location">{result.location}</span>
                                <span className="studio-count">{result.matches.length}</span>
                            </header>
                            <ul>
                                {result.matches.map((match) => (
                                    <li key={`${match.line}:${match.column}`}>
                                        <button
                                            type="button"
                                            className="studio-result-row"
                                            onClick={() => onOpenMatch(result, match)}
                                        >
                                            <span className="studio-result-line">{match.line}</span>
                                            <span className="studio-result-text">
                                                <Snippet match={match} />
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

export default SearchTab;
