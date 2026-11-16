import { useEffect, useMemo, useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { toast } from "sonner";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ChevronRightIcon,
    CodeBracketIcon,
    DocumentDuplicateIcon,
    EllipsisHorizontalIcon,
    LinkIcon,
    PlusIcon,
    RectangleGroupIcon,
    ScissorsIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import { listSchemaPaths } from "@pages/protocol-studio/ui/editor/contracts/specs/schema";
import { sentenceText } from "@pages/protocol-studio/ui/editor/contracts/validations/jval";
import {
    flattenTests,
    type ValidationsModel,
    type VTest,
} from "@pages/protocol-studio/ui/editor/contracts/validations/model";
import {
    outermostAlias,
    type ContractEdit,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";
import { RuleForm } from "@pages/protocol-studio/ui/editor/stages/specification/rule-form";
import { Sentence } from "@pages/protocol-studio/ui/editor/stages/specification/fields";
import { useSpecPortal } from "@pages/protocol-studio/ui/editor/stages/specification/portal";
import type { SpecFocus } from "@pages/protocol-studio/ui/editor/stages/specification/types";

/** The `_TESTS_` key an api's tests are under (`on_search1` → `on_search`). */
export const testKeyFor = (model: ValidationsModel | null, api: string) => {
    if (!model) return undefined;
    if (model.tests.has(api)) return api;
    const bare = api.replace(/\d+$/, "");
    return model.tests.has(bare) ? bare : undefined;
};

/** The test checks the field (or something under it), or decides on exactly it: as the schema's ⚑ counts. */
const matchesPath = (test: VTest, path: string) =>
    test.checks.some((p) => p === path || p.startsWith(`${path}.`) || p.startsWith(`${path}[`)) ||
    test.guards.includes(path);

const NEW_RULE = (n: number) => ({
    _NAME_: `NEW_TEST_${n}`,
    attr: "$.context.action",
    _RETURN_: "attr are present",
});

interface IValidationsFacetProps {
    api: string;
    contracts: StudioContracts;
    focus?: SpecFocus;
    onShowPath: (path: string) => void;
    onReveal: (line: number) => void;
}

export const ValidationsFacet = ({
    api,
    contracts,
    focus,
    onShowPath,
    onReveal,
}: IValidationsFacetProps) => {
    const { models, files, ops } = contracts;
    const model = models.validations;
    const key = testKeyFor(model, api);
    const tests = useMemo(() => (key ? (model?.tests.get(key) ?? []) : []), [model, key]);
    const all = useMemo(() => flattenTests(tests), [tests]);
    const editable = ops.isEditable("validations");
    const parsed = files.validations.parsed;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [pathFilter, setPathFilter] = useState<string | null>(null);
    const [guardFilter, setGuardFilter] = useState<string>("");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);
    const portal = useSpecPortal();

    // Arriving with a focus: a path filters, a test is selected.
    useEffect(() => {
        if (focus?.path) setPathFilter(focus.path);
        if (focus?.testId) setSelectedId(focus.testId);
    }, [focus?.nonce]);
    useEffect(() => {
        setPathFilter(focus?.path ?? null);
        setQuery("");
        setGuardFilter("");
    }, [api]);

    const candidate = selectedId ? model?.byId.get(selectedId) : undefined;
    const selected = candidate && candidate.api === key ? candidate : null;
    useEffect(() => {
        if (!selected && all.length)
            setSelectedId(all.find((t) => t.kind === "rule")?.id ?? all[0]!.id);
    }, [selected, all]);
    useEffect(() => {
        if (!selectedId) return;
        listRef.current
            ?.querySelector(`[data-test-id="${CSS.escape(selectedId)}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [selectedId]);

    const guardValues = useMemo(() => {
        const values = new Set<string>();
        for (const test of all) {
            const only = test.guard?.only;
            if (only && "values" in only) only.values.forEach((v) => values.add(v));
        }
        return [...values].sort();
    }, [all]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const keep = (test: VTest): boolean => {
            if (pathFilter && !matchesPath(test, pathFilter)) return false;
            if (guardFilter) {
                const only = test.guard?.only;
                if (only && "values" in only && !only.values.includes(guardFilter)) return false;
            }
            if (needle) {
                const hay = [
                    test.name,
                    test.description,
                    test.returnExpr,
                    ...test.checks,
                    test.sentence ? sentenceText(test.sentence) : "",
                ]
                    .join(" ")
                    .toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            return true;
        };
        const ids = new Set<string>();
        const walk = (list: VTest[]): boolean => {
            let any = false;
            for (const test of list) {
                const inside = test.children ? walk(test.children) : false;
                if (inside || keep(test)) {
                    ids.add(test.id);
                    any = true;
                }
            }
            return any;
        };
        walk(tests);
        return ids;
    }, [tests, query, pathFilter, guardFilter]);

    // A filter that hides the selected test moves the selection to the first test it shows.
    useEffect(() => {
        if (!selectedId || visible.has(selectedId)) return;
        const first = all.find((t) => t.kind === "rule" && visible.has(t.id));
        if (first) setSelectedId(first.id);
    }, [visible]);

    const suggestions = useMemo(
        () => (models.spec ? listSchemaPaths(models.spec, api) : []),
        [models.spec, api]
    );

    const edit = (edits: ContractEdit[], done?: string) => {
        const result = ops.applyEdit("validations", edits);
        if (!result.ok) toast.error(result.error);
        else if (done) toast.success(done);
        return result.ok;
    };

    const nextName = (base: string) => {
        const names = new Set(all.map((t) => t.name));
        let n = 1;
        while (names.has(`${base}_${n}`)) n++;
        return `${base}_${n}`;
    };

    /** Adds a rule (or group) at the end of the api's list, or inside a group. */
    const add = (kind: "rule" | "group", into?: VTest) => {
        const rule = { ...NEW_RULE(0), _NAME_: nextName("NEW_TEST") };
        const value = kind === "group" ? { _NAME_: nextName("NEW_GROUP"), _RETURN_: [rule] } : rule;
        if (into) {
            const at = [...into.at, "_RETURN_"];
            const index = into.children?.length ?? 0;
            if (edit([{ op: "insertSeqItem", at, index, value }]))
                setSelectedId(`${into.id}.${index}`);
            return;
        }
        if (!key) {
            const hasTests = model && model.testsLine !== undefined;
            const ok = edit(
                hasTests
                    ? [{ op: "setPair", at: ["_TESTS_"], key: api, value: [value] }]
                    : [{ op: "setPair", at: [], key: "_TESTS_", value: { [api]: [value] } }]
            );
            if (ok) setSelectedId(`${api}/0`);
            return;
        }
        if (edit([{ op: "insertSeqItem", at: ["_TESTS_", key], index: tests.length, value }])) {
            setSelectedId(`${key}/${tests.length}`);
        }
    };

    const siblingsOf = (test: VTest) => {
        const parentPath = test.indexPath.slice(0, -1);
        if (!parentPath.length) return tests;
        return model?.byId.get(`${test.api}/${parentPath.join(".")}`)?.children ?? [];
    };
    const idAt = (test: VTest, index: number) =>
        `${test.api}/${[...test.indexPath.slice(0, -1), index].join(".")}`;

    const actions = {
        duplicate: (test: VTest) => {
            const index = test.indexPath[test.indexPath.length - 1]!;
            const at = test.at.slice(0, -1);
            const edits: ContractEdit[] = [{ op: "duplicateSeqItem", at, index }];
            if (test.name !== undefined) {
                edits.push({
                    op: "setScalar",
                    at: [...at, index + 1, "_NAME_"],
                    value: nextName(`${test.name.replace(/_COPY(_\d+)?$/, "")}_COPY`),
                });
            }
            if (edit(edits)) setSelectedId(idAt(test, index + 1));
        },
        move: (test: VTest, delta: number) => {
            const index = test.indexPath[test.indexPath.length - 1]!;
            const to = index + delta;
            if (to < 0 || to >= siblingsOf(test).length) return;
            if (edit([{ op: "moveSeqItem", at: test.at.slice(0, -1), from: index, to }]))
                setSelectedId(idAt(test, to));
        },
        remove: (test: VTest) => {
            const index = test.indexPath[test.indexPath.length - 1]!;
            if (
                edit(
                    [{ op: "removeSeqItem", at: test.at.slice(0, -1), index }],
                    `Deleted ${test.name ?? "the test"} · ⌘Z to undo`
                )
            ) {
                const siblings = siblingsOf(test);
                setSelectedId(siblings.length > 1 ? idAt(test, Math.max(0, index - 1)) : null);
            }
        },
        unshare: (test: VTest) => {
            if (!parsed) return;
            const at = outermostAlias(parsed, test.at) ?? (test.shared?.isAlias ? test.at : null);
            if (!at) return;
            edit([{ op: "unshare", at }], "Made a separate copy here");
        },
    };

    if (!model) {
        return (
            <div className="studio-spec-empty-state">
                <p className="studio-empty-hint-title">
                    {files.validations.parsed?.errors.length
                        ? "validations.yaml doesn't parse"
                        : "No validations.yaml"}
                </p>
                <p className="studio-empty-hint-sub">
                    {files.validations.parsed?.errors.length
                        ? "Fix it in Source; the tests show again once it parses."
                        : "Import the spec's files from GitHub, or upload validations.yaml."}
                </p>
            </div>
        );
    }

    const renderTest = (test: VTest, depth: number): React.ReactNode => {
        if (!visible.has(test.id)) return null;
        const isGroup = test.kind === "group";
        const isCollapsed = collapsed.has(test.id) && !query && !pathFilter;
        const isSelected = test.id === selectedId;
        return (
            <li key={test.id} className="studio-spec-test-item">
                <div
                    className="studio-spec-test"
                    role="button"
                    tabIndex={0}
                    data-test-id={test.id}
                    data-test-name={test.name}
                    data-kind={test.kind}
                    data-selected={isSelected || undefined}
                    data-shared={test.shared?.anchor}
                    data-invalid={
                        test.returnError || test.continueError || test.unknownVars.length
                            ? true
                            : undefined
                    }
                    style={{ "--depth": depth } as React.CSSProperties}
                    onClick={() => setSelectedId(test.id)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(test.id);
                        }
                    }}
                >
                    {isGroup ? (
                        <button
                            type="button"
                            className="studio-spec-twisty"
                            data-open={!isCollapsed || undefined}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCollapsed((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(test.id)) next.delete(test.id);
                                    else next.add(test.id);
                                    return next;
                                });
                            }}
                            aria-label={isCollapsed ? "Expand group" : "Collapse group"}
                        >
                            <ChevronRightIcon />
                        </button>
                    ) : (
                        <span className="studio-spec-twisty" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <span className="studio-mono studio-spec-test-name truncate">
                                {test.name ?? "(unnamed)"}
                            </span>
                            {isGroup ? (
                                <span className="studio-badge">
                                    group · {test.children?.length ?? 0}
                                </span>
                            ) : null}
                            {test.shared ? (
                                <span
                                    className="studio-spec-shared"
                                    title={
                                        test.shared.isAlias
                                            ? `Reuses *${test.shared.anchor} (${test.shared.uses} places): editing it edits all of them`
                                            : `Defined here as &${test.shared.anchor}, reused in ${test.shared.uses - 1} other places`
                                    }
                                >
                                    <LinkIcon />
                                    {test.shared.uses}
                                </span>
                            ) : null}
                            {test.guard?.only && "values" in test.guard.only ? (
                                <span
                                    className="studio-spec-only"
                                    title={sentenceText(test.guard.parts)}
                                >
                                    {test.guard.only.values.join(" · ")}
                                </span>
                            ) : null}
                        </div>
                        {!isGroup && test.sentence ? (
                            <p className="studio-spec-test-sentence">
                                <Sentence parts={test.sentence} />
                            </p>
                        ) : !isGroup && test.returnError ? (
                            <p className="studio-spec-test-sentence studio-spec-bad">
                                _RETURN_: {test.returnError.error}
                            </p>
                        ) : test.description ? (
                            <p className="studio-spec-test-sentence">{test.description}</p>
                        ) : null}
                    </div>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                type="button"
                                className="studio-key studio-key-xs studio-key-icon studio-spec-test-menu"
                                aria-label={`Actions for ${test.name ?? "test"}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <EllipsisHorizontalIcon />
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal container={portal}>
                            <DropdownMenu.Content
                                className="studio-glass studio-spec-menu"
                                align="end"
                                sideOffset={4}
                                // React events bubble through the portal to the row: keep them from selecting it.
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                            >
                                <DropdownMenu.Item
                                    className="studio-menu-item"
                                    onSelect={() => onReveal(test.line)}
                                >
                                    <CodeBracketIcon />
                                    Show in Source
                                </DropdownMenu.Item>
                                {editable ? (
                                    <>
                                        {isGroup ? (
                                            <DropdownMenu.Item
                                                className="studio-menu-item"
                                                onSelect={() => add("rule", test)}
                                            >
                                                <PlusIcon />
                                                Add a test inside
                                            </DropdownMenu.Item>
                                        ) : null}
                                        <DropdownMenu.Item
                                            className="studio-menu-item"
                                            onSelect={() => actions.duplicate(test)}
                                        >
                                            <DocumentDuplicateIcon />
                                            Duplicate
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                            className="studio-menu-item"
                                            onSelect={() => actions.move(test, -1)}
                                        >
                                            <ArrowUpIcon />
                                            Move up
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                            className="studio-menu-item"
                                            onSelect={() => actions.move(test, 1)}
                                        >
                                            <ArrowDownIcon />
                                            Move down
                                        </DropdownMenu.Item>
                                        {test.shared?.isAlias ? (
                                            <DropdownMenu.Item
                                                className="studio-menu-item"
                                                onSelect={() => actions.unshare(test)}
                                            >
                                                <ScissorsIcon />
                                                Make a separate copy here
                                            </DropdownMenu.Item>
                                        ) : null}
                                        <DropdownMenu.Separator className="studio-spec-menu-sep" />
                                        <DropdownMenu.Item
                                            className="studio-menu-item"
                                            data-tone="danger"
                                            onSelect={() => actions.remove(test)}
                                        >
                                            <TrashIcon />
                                            Delete
                                        </DropdownMenu.Item>
                                    </>
                                ) : null}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>
                {isGroup && !isCollapsed && test.children?.length ? (
                    <ul>{test.children.map((child) => renderTest(child, depth + 1))}</ul>
                ) : null}
            </li>
        );
    };

    const ruleCount = all.filter((t) => t.kind === "rule").length;

    return (
        <div className="studio-spec-split" data-facet="validations">
            <div className="studio-spec-list-pane" ref={listRef}>
                <div className="studio-spec-toolbar">
                    <input
                        className="bp-input studio-spec-search"
                        placeholder={`Search ${ruleCount} tests…`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        spellCheck={false}
                    />
                    {guardValues.length ? (
                        <select
                            className="bp-input studio-spec-guard-select"
                            value={guardFilter}
                            onChange={(e) => setGuardFilter(e.target.value)}
                            aria-label="Only tests for"
                            title="Tests that only apply to a use case"
                        >
                            <option value="">Any use case</option>
                            {guardValues.map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    ) : null}
                    {editable ? (
                        <>
                            <button
                                type="button"
                                className="studio-key studio-key-sm"
                                onClick={() => add("rule")}
                                data-action="add-test"
                            >
                                <PlusIcon />
                                Test
                            </button>
                            <button
                                type="button"
                                className="studio-key studio-key-sm"
                                onClick={() => add("group")}
                                title="A group of tests that share a scope or guard"
                            >
                                <RectangleGroupIcon />
                                Group
                            </button>
                        </>
                    ) : null}
                </div>
                {pathFilter ? (
                    <div className="studio-spec-filter">
                        <span>checking</span>
                        <code>{pathFilter}</code>
                        <button
                            type="button"
                            onClick={() => setPathFilter(null)}
                            aria-label="Clear the path filter"
                        >
                            <XMarkIcon />
                        </button>
                    </div>
                ) : null}
                {tests.length === 0 ? (
                    <div className="studio-spec-empty-state">
                        <p className="studio-empty-hint-title">No tests for {api}</p>
                        <p className="studio-empty-hint-sub">
                            {editable
                                ? "Add the first one: it goes under _TESTS_."
                                : "validations.yaml has no _TESTS_ entry for it."}
                        </p>
                        {editable ? (
                            <button
                                type="button"
                                className="studio-key studio-key-sm"
                                onClick={() => add("rule")}
                            >
                                <PlusIcon />
                                Add first test
                            </button>
                        ) : null}
                    </div>
                ) : visible.size === 0 ? (
                    <p className="studio-spec-empty">No test matches.</p>
                ) : (
                    <ul className="studio-spec-tests" aria-label={`Tests for ${api}`}>
                        {tests.map((test) => renderTest(test, 0))}
                    </ul>
                )}
            </div>
            <div className="studio-spec-form-pane">
                {selected && parsed ? (
                    <RuleForm
                        key={selected.id}
                        test={selected}
                        parsed={parsed}
                        editable={editable}
                        suggestions={suggestions}
                        onEdit={(edits) => edit(edits)}
                        onUnshare={() => actions.unshare(selected)}
                        onShowPath={onShowPath}
                        onReveal={() => onReveal(selected.line)}
                        onSelectTest={setSelectedId}
                    />
                ) : (
                    <p className="studio-spec-empty">Pick a test to read or edit it.</p>
                )}
            </div>
        </div>
    );
};

export default ValidationsFacet;
