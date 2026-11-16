import { useMemo, useState } from "react";
import {
    CodeBracketIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    PlusIcon,
    ScissorsIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import { TextField } from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import {
    describeGuard,
    describeRule,
    renameJvalVariable,
    tryParseJval,
    type JvalOperand,
} from "@pages/protocol-studio/ui/editor/contracts/validations/jval";
import type { VTest, VVar } from "@pages/protocol-studio/ui/editor/contracts/validations/model";
import { canonicalPath } from "@pages/protocol-studio/ui/editor/contracts/validations/paths";
import type { ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import {
    outermostAlias,
    type ContractEdit,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";
import { sharedImpact } from "@pages/protocol-studio/ui/editor/contracts/yaml/shared";
import {
    ChipsField,
    ExpressionField,
    FormRow,
    PathInput,
    Sentence,
} from "@pages/protocol-studio/ui/editor/stages/specification/fields";

interface IRuleFormProps {
    test: VTest;
    parsed: ParsedContract;
    editable: boolean;
    /** The api's request paths. */
    suggestions: string[];
    onEdit: (edits: ContractEdit[]) => boolean;
    onUnshare: () => void;
    onShowPath: (path: string) => void;
    onReveal: () => void;
    onSelectTest: (id: string) => void;
}

const VAR_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const operand = (v: VVar): JvalOperand =>
    v.kind === "path"
        ? { name: v.name, kind: "path", path: v.absolute ?? v.path }
        : v.kind === "list"
          ? { name: v.name, kind: "list", values: v.value as string[] }
          : v.kind === "scalar"
            ? { name: v.name, kind: "scalar", value: String(v.value) }
            : { name: v.name, kind: "unknown" };

/** A path suggestion made relative to the test's scope, when it is under it. */
const relativeTo = (scope: string | undefined, paths: string[]) => {
    if (!scope) return paths;
    const base = canonicalPath(scope)?.path ?? scope;
    return paths.flatMap((p) => (p.startsWith(`${base}.`) ? [`$${p.slice(base.length)}`] : []));
};

/**
 * One test, as a form: what it's called, where it looks (`_SCOPE_`), its
 * variables, what must hold (`_RETURN_`) and when it applies (`_CONTINUE_`).
 * Every change is a minimal edit of validations.yaml.
 */
export const RuleForm = ({
    test,
    parsed,
    editable,
    suggestions,
    onEdit,
    onUnshare,
    onShowPath,
    onReveal,
    onSelectTest,
}: IRuleFormProps) => {
    const at = test.at;
    const impact = useMemo(() => sharedImpact(parsed, at), [parsed, at]);
    const throughAlias = useMemo(() => outermostAlias(parsed, at), [parsed, at]);
    const [newVar, setNewVar] = useState<{ name: string; kind: "path" | "list" | "value" } | null>(
        null
    );

    const effective = useMemo(() => {
        const map = new Map<string, VVar>();
        for (const v of test.vars) map.set(v.name, v);
        for (const v of test.inherited) map.set(v.name, v);
        return map;
    }, [test]);
    const lookup = (name: string) => {
        const v = effective.get(name);
        return v ? operand(v) : undefined;
    };
    const variableNames = [...effective.keys()];
    const scopedSuggestions = useMemo(
        () => relativeTo(test.effectiveScope, suggestions),
        [test.effectiveScope, suggestions]
    );

    const set = (field: string, value: string | null) =>
        value === null || value === ""
            ? onEdit([{ op: "removePair", at, key: field }])
            : onEdit([{ op: "setPair", at, key: field, value }]);
    /** A text field's commit: unchanged does nothing, empty removes the key. */
    const commit = (field: string, current: unknown) => (value: string) => {
        const next = value.trim();
        if (editable && next !== String(current ?? "")) set(field, next || null);
        return null;
    };

    const renameVar = (from: string, to: string): string | null => {
        if (to === from) return null;
        if (!VAR_NAME.test(to)) return "Letters, digits and _ only; can't start with a digit";
        if (effective.has(to)) return `${to} already exists here`;
        const edits: ContractEdit[] = [{ op: "renameKey", at, from, to }];
        if (test.returnExpr !== undefined) {
            const next = renameJvalVariable(test.returnExpr, from, to);
            if (next !== test.returnExpr)
                edits.push({ op: "setScalar", at: [...at, "_RETURN_"], value: next });
        }
        if (test.continueExpr !== undefined) {
            const next = renameJvalVariable(test.continueExpr, from, to);
            if (next !== test.continueExpr)
                edits.push({ op: "setScalar", at: [...at, "_CONTINUE_"], value: next });
        }
        onEdit(edits);
        return null;
    };

    const addVar = () => {
        if (!newVar) return;
        const name = newVar.name.trim();
        if (!VAR_NAME.test(name) || effective.has(name)) return;
        const value = newVar.kind === "path" ? "$." : newVar.kind === "list" ? [] : "";
        if (onEdit([{ op: "setPair", at, key: name, value }])) setNewVar(null);
    };

    const returnPreview = (expr: string) => {
        const parsedExpr = tryParseJval(expr);
        return "ast" in parsedExpr ? (
            <Sentence parts={describeRule(parsedExpr.ast, lookup)} onPath={onShowPath} />
        ) : null;
    };
    const guardPreview = (expr: string) => {
        const parsedExpr = tryParseJval(expr);
        return "ast" in parsedExpr ? (
            <Sentence parts={describeGuard(parsedExpr.ast, lookup).parts} onPath={onShowPath} />
        ) : null;
    };

    return (
        <div className="studio-spec-form" data-rule-form={test.id}>
            <header className="studio-spec-form-head">
                <div className="min-w-0 flex-1">
                    <p className="studio-eyebrow">
                        {test.kind === "group" ? "Group" : "Test"} · {test.api}
                        {test.indexPath.length > 1 ? " · inside a group" : ""}
                    </p>
                    <p className="studio-card-title studio-mono">{test.name ?? "(unnamed)"}</p>
                </div>
                <button
                    type="button"
                    className="studio-key studio-key-sm"
                    onClick={onReveal}
                    title="Show this test in validations.yaml"
                >
                    <CodeBracketIcon />
                    Source
                </button>
            </header>

            {impact ? (
                <div className="studio-spec-banner" data-tone="shared">
                    <LinkIcon />
                    <div className="min-w-0 flex-1">
                        <p>
                            {impact.throughAlias ? (
                                <>
                                    This reuses <code>*{impact.anchor}</code>, which appears in{" "}
                                    {impact.uses.length} places. Edits here change all of them.
                                </>
                            ) : (
                                <>
                                    Defined here as <code>&amp;{impact.anchor}</code> and reused in{" "}
                                    {impact.uses.length - 1} other{" "}
                                    {impact.uses.length - 1 === 1 ? "place" : "places"}. Edits
                                    change all of them.
                                </>
                            )}
                        </p>
                    </div>
                    {editable && throughAlias ? (
                        <button
                            type="button"
                            className="studio-key studio-key-sm"
                            onClick={onUnshare}
                            title="Copy the shared content in here, so edits stay local"
                        >
                            <ScissorsIcon />
                            Separate copy
                        </button>
                    ) : null}
                </div>
            ) : null}

            {test.shadowed.length ? (
                <div className="studio-spec-banner" data-tone="warn">
                    <ExclamationTriangleIcon />
                    <p>
                        The parent group also declares{" "}
                        {test.shadowed.map((n) => (
                            <code key={n}>{n}</code>
                        ))}
                        : the compiler uses the parent's value, not this one.
                    </p>
                </div>
            ) : null}

            <div className="studio-spec-form-body">
                <div className="bp-props-grid">
                    <TextField
                        label="_NAME_"
                        mono
                        value={test.name ?? ""}
                        onCommit={commit("_NAME_", test.name)}
                    />
                    <TextField
                        label="_DESCRIPTION_"
                        hint="What the test checks, in words (shown in reports)"
                        multiline
                        value={test.description ?? ""}
                        placeholder="optional"
                        onCommit={commit("_DESCRIPTION_", test.description)}
                    />
                </div>

                <FormRow
                    label="_SCOPE_"
                    hint="Paths below are read relative to this one ($.x → scope.x)"
                >
                    <PathInput
                        value={test.scope ?? ""}
                        placeholder="optional · e.g. $.message.order.items[*]"
                        suggestions={suggestions}
                        onCommit={(value) => commit("_SCOPE_", test.scope)(value)}
                    />
                    {test.effectiveScope && test.effectiveScope !== test.scope ? (
                        <p className="studio-spec-hint">
                            In force: <code>{test.effectiveScope}</code>
                        </p>
                    ) : null}
                </FormRow>

                <section className="studio-spec-vars" aria-label="Variables">
                    <div className="studio-spec-vars-head">
                        <p className="studio-eyebrow">Variables</p>
                        {editable ? (
                            <button
                                type="button"
                                className="studio-key studio-key-xs"
                                onClick={() => setNewVar({ name: "", kind: "path" })}
                            >
                                <PlusIcon />
                                Variable
                            </button>
                        ) : null}
                    </div>
                    {test.vars.length === 0 && !newVar ? (
                        <p className="studio-spec-hint">
                            No variables. Add a path (e.g. attr) and a list (e.g. enumList).
                        </p>
                    ) : null}
                    {test.vars.map((v) => (
                        <VariableRow
                            key={v.name}
                            variable={v}
                            editable={editable}
                            suggestions={scopedSuggestions}
                            used={variableUsed(test, v.name)}
                            onRename={(to) => renameVar(v.name, to)}
                            onRemove={() => onEdit([{ op: "removePair", at, key: v.name }])}
                            onValue={(value) =>
                                onEdit([{ op: "setScalar", at: [...at, v.name], value }])
                            }
                            onList={(values) =>
                                onEdit([{ op: "setSeqItems", at: [...at, v.name], items: values }])
                            }
                            onUnshare={() => onEdit([{ op: "unshare", at: [...at, v.name] }])}
                            onShowPath={onShowPath}
                        />
                    ))}
                    {newVar ? (
                        <div className="studio-spec-var studio-spec-var-new">
                            <input
                                className="bp-input studio-mono"
                                autoFocus
                                placeholder="name"
                                value={newVar.name}
                                onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addVar();
                                    if (e.key === "Escape") setNewVar(null);
                                }}
                            />
                            <select
                                className="bp-input"
                                value={newVar.kind}
                                onChange={(e) =>
                                    setNewVar({
                                        ...newVar,
                                        kind: e.target.value as "path" | "list" | "value",
                                    })
                                }
                                aria-label="Kind"
                            >
                                <option value="path">path ($.…)</option>
                                <option value="list">list of values</option>
                                <option value="value">single value</option>
                            </select>
                            <button
                                type="button"
                                className="studio-key studio-key-sm"
                                onClick={addVar}
                                disabled={
                                    !VAR_NAME.test(newVar.name.trim()) ||
                                    effective.has(newVar.name.trim())
                                }
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                className="studio-key studio-key-sm studio-key-icon"
                                onClick={() => setNewVar(null)}
                                aria-label="Cancel"
                            >
                                <XMarkIcon />
                            </button>
                        </div>
                    ) : null}
                    {test.inherited.length ? (
                        <div className="studio-spec-inherited">
                            <p className="studio-spec-hint">
                                From the parent group (read-only here):
                            </p>
                            {test.inherited.map((v) => (
                                <div key={v.name} className="studio-spec-var" data-inherited>
                                    <code className="studio-spec-var-name">{v.name}</code>
                                    <span className="studio-mono studio-text-dim truncate">
                                        {v.kind === "list"
                                            ? `[${(v.value as string[]).join(", ")}]`
                                            : String(v.value ?? "")}
                                    </span>
                                    <button
                                        type="button"
                                        className="studio-key studio-key-xs"
                                        onClick={() =>
                                            onSelectTest(
                                                `${test.api}/${test.indexPath.slice(0, -1).join(".")}`
                                            )
                                        }
                                    >
                                        parent
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </section>

                {test.kind === "rule" ? (
                    <FormRow label="_RETURN_" hint="What must hold for the payload to pass">
                        {editable ? (
                            <ExpressionField
                                value={test.returnExpr ?? ""}
                                variables={variableNames}
                                placeholder="attr are present && attr all in enumList"
                                preview={test.returnExpr ? returnPreview(test.returnExpr) : null}
                                onCommit={(value) =>
                                    onEdit([{ op: "setPair", at, key: "_RETURN_", value }])
                                }
                            />
                        ) : (
                            <p className="studio-spec-readonly studio-mono">{test.returnExpr}</p>
                        )}
                    </FormRow>
                ) : (
                    <FormRow label="_RETURN_" hint="A group passes when every test in it passes">
                        <ul className="studio-spec-children">
                            {test.children?.map((child) => (
                                <li key={child.id}>
                                    <button type="button" onClick={() => onSelectTest(child.id)}>
                                        <span className="studio-mono">
                                            {child.name ?? "(unnamed)"}
                                        </span>
                                        {child.kind === "group" ? (
                                            <span className="studio-badge">group</span>
                                        ) : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </FormRow>
                )}

                <FormRow
                    label="_CONTINUE_"
                    hint="Skip condition: when it holds, the test is skipped"
                    aside={
                        editable && test.continueExpr !== undefined ? (
                            <button
                                type="button"
                                className="studio-key studio-key-xs"
                                onClick={() => set("_CONTINUE_", null)}
                            >
                                remove
                            </button>
                        ) : null
                    }
                >
                    {editable ? (
                        <ExpressionField
                            value={test.continueExpr ?? ""}
                            variables={variableNames}
                            placeholder="optional · e.g. !(attr are present)"
                            preview={test.continueExpr ? guardPreview(test.continueExpr) : null}
                            onCommit={(value) => commit("_CONTINUE_", test.continueExpr)(value)}
                        />
                    ) : test.continueExpr !== undefined ? (
                        <p className="studio-spec-readonly studio-mono">{test.continueExpr}</p>
                    ) : null}
                    {test.continueExpr === undefined ? (
                        <p className="studio-spec-hint">Always applies.</p>
                    ) : null}
                </FormRow>

                {test.errorCode !== undefined || test.successCode !== undefined ? (
                    <div className="bp-props-grid">
                        {test.errorCode !== undefined ? (
                            <TextField
                                label="_ERROR_CODE_"
                                mono
                                value={String(test.errorCode ?? "")}
                                onCommit={commit("_ERROR_CODE_", test.errorCode)}
                            />
                        ) : null}
                        {test.successCode !== undefined ? (
                            <TextField
                                label="_SUCCESS_CODE_"
                                mono
                                value={String(test.successCode ?? "")}
                                onCommit={commit("_SUCCESS_CODE_", test.successCode)}
                            />
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const variableUsed = (test: VTest, name: string) => {
    const re = new RegExp(`(^|[^a-zA-Z0-9_])${name}($|[^a-zA-Z0-9_])`);
    return (
        re.test(test.returnExpr ?? "") || re.test(test.continueExpr ?? "") || test.kind === "group"
    );
};

interface IVariableRowProps {
    variable: VVar;
    editable: boolean;
    suggestions: string[];
    used: boolean;
    onRename: (to: string) => string | null;
    onRemove: () => void;
    onValue: (value: string) => void;
    onList: (values: string[]) => void;
    onUnshare: () => void;
    onShowPath: (path: string) => void;
}

/** One variable: its name, and a path, a list of values or a single value. */
const VariableRow = ({
    variable: v,
    editable,
    suggestions,
    used,
    onRename,
    onRemove,
    onValue,
    onList,
    onUnshare,
    onShowPath,
}: IVariableRowProps) => {
    const [name, setName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const commitName = () => {
        if (name === null) return;
        const problem = onRename(name.trim());
        setError(problem);
        if (!problem) setName(null);
    };
    return (
        <div className="studio-spec-var" data-rule-field={v.name} data-unused={!used || undefined}>
            <div className="studio-spec-var-label">
                {editable ? (
                    <input
                        className="studio-spec-var-name studio-mono"
                        value={name ?? v.name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commitName();
                            if (e.key === "Escape") {
                                setName(null);
                                setError(null);
                            }
                        }}
                        aria-invalid={error ? true : undefined}
                        title={
                            error ??
                            (used
                                ? "Rename (expressions follow)"
                                : "Not used by _RETURN_ or _CONTINUE_")
                        }
                        spellCheck={false}
                    />
                ) : (
                    <code className="studio-spec-var-name">{v.name}</code>
                )}
                {error ? <p className="bp-field-error">{error}</p> : null}
            </div>
            <div className="studio-spec-var-value">
                {v.alias ? (
                    <p className="studio-spec-hint">
                        <LinkIcon className="inline size-3" /> shared list <code>*{v.alias}</code>:
                        edits change every use.
                        {editable ? (
                            <button
                                type="button"
                                className="studio-spec-inline-action"
                                onClick={onUnshare}
                            >
                                Copy it here
                            </button>
                        ) : null}
                    </p>
                ) : null}
                {v.kind === "path" ? (
                    editable ? (
                        <PathInput
                            value={String(v.value)}
                            suggestions={suggestions}
                            onCommit={onValue}
                            onShow={
                                v.canonical && !v.external
                                    ? () => onShowPath(v.canonical!)
                                    : undefined
                            }
                        />
                    ) : (
                        <code className="studio-mono">{String(v.value)}</code>
                    )
                ) : v.kind === "list" ? (
                    <ChipsField
                        values={v.value as string[]}
                        onChange={onList}
                        disabled={!editable}
                    />
                ) : v.kind === "scalar" ? (
                    editable ? (
                        <input
                            className="bp-input studio-mono"
                            defaultValue={String(v.value ?? "")}
                            key={String(v.value)}
                            onBlur={(e) =>
                                e.target.value !== String(v.value ?? "") && onValue(e.target.value)
                            }
                            onKeyDown={(e) =>
                                e.key === "Enter" && (e.target as HTMLInputElement).blur()
                            }
                        />
                    ) : (
                        <code className="studio-mono">{String(v.value)}</code>
                    )
                ) : (
                    <p className="studio-spec-hint">A nested value: edit it in Source.</p>
                )}
                {v.kind === "path" && v.absolute && v.absolute !== v.path ? (
                    <p className="studio-spec-hint">
                        reads <code>{v.absolute}</code>
                    </p>
                ) : null}
            </div>
            {editable ? (
                <button
                    type="button"
                    className="studio-tree-remove"
                    onClick={onRemove}
                    aria-label={`Remove ${v.name}`}
                    title="Remove variable"
                >
                    <XMarkIcon />
                </button>
            ) : null}
        </div>
    );
};

export default RuleForm;
