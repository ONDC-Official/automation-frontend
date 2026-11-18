import { useId, useMemo, useState, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import {
    BINARY_OPS,
    jvalVariables,
    tryParseJval,
    UNARY_OPS,
    type SentencePart,
} from "@pages/protocol-studio/ui/editor/contracts/validations/jval";

/** A rule or guard read out loud, its paths and value lists as chips. */
export const Sentence = ({
    parts,
    onPath,
}: {
    parts: SentencePart[];
    /** Clicking a path chip: e.g. show it in the schema. */
    onPath?: (path: string) => void;
}) => (
    <span className="studio-spec-sentence">
        {parts.map((part, i) => {
            if (typeof part === "string") return <span key={i}>{part}</span>;
            if (part.kind === "path") {
                return onPath ? (
                    <button
                        key={i}
                        type="button"
                        className="studio-spec-path"
                        title={`${part.name} · show in schema`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPath(part.path);
                        }}
                    >
                        {part.path}
                    </button>
                ) : (
                    <code key={i} className="studio-spec-path" title={part.name}>
                        {part.path}
                    </code>
                );
            }
            if (part.kind === "values") {
                const shown = part.values.slice(0, 6);
                return (
                    <span
                        key={i}
                        className="studio-spec-values"
                        title={`${part.name}: ${part.values.join(", ")}`}
                    >
                        [{shown.join(", ")}
                        {part.values.length > shown.length
                            ? `, +${part.values.length - shown.length}`
                            : ""}
                        ]
                    </span>
                );
            }
            return (
                <code key={i} className="studio-spec-var" data-unknown={!part.known || undefined}>
                    {part.name}
                </code>
            );
        })}
    </span>
);

/** Chips with an inline add box: Enter, comma or paste adds; × removes. */
export const ChipsField = ({
    values,
    onChange,
    placeholder = "add value…",
    suggestions,
    disabled,
}: {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    suggestions?: string[];
    disabled?: boolean;
}) => {
    const [draft, setDraft] = useState("");
    const listId = useId();
    const add = (raw: string) => {
        const added = raw
            .split(/[,\n]/)
            .map((v) => v.trim())
            .filter((v) => v && !values.includes(v));
        if (added.length) onChange([...values, ...added]);
        setDraft("");
    };
    return (
        <div className="studio-spec-chips" data-disabled={disabled || undefined}>
            {values.map((value, i) => (
                <span key={`${value}-${i}`} className="studio-spec-chip">
                    <span className="studio-mono">{value}</span>
                    {!disabled ? (
                        <button
                            type="button"
                            aria-label={`Remove ${value}`}
                            onClick={() => onChange(values.filter((_, j) => j !== i))}
                        >
                            <XMarkIcon />
                        </button>
                    ) : null}
                </span>
            ))}
            {!disabled ? (
                <>
                    <input
                        className="studio-spec-chip-input studio-mono"
                        value={draft}
                        placeholder={values.length ? "" : placeholder}
                        list={suggestions?.length ? listId : undefined}
                        spellCheck={false}
                        onChange={(e) => {
                            const next = e.target.value;
                            if (next.includes(",")) add(next);
                            else setDraft(next);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                add(draft);
                            } else if (e.key === "Backspace" && !draft && values.length) {
                                onChange(values.slice(0, -1));
                            }
                        }}
                        onBlur={() => draft && add(draft)}
                        onPaste={(e) => {
                            const text = e.clipboardData.getData("text");
                            if (/[,\n]/.test(text)) {
                                e.preventDefault();
                                add(text);
                            }
                        }}
                    />
                    {suggestions?.length ? (
                        <datalist id={listId}>
                            {suggestions
                                .filter((s) => !values.includes(s))
                                .slice(0, 200)
                                .map((s) => (
                                    <option key={s} value={s} />
                                ))}
                        </datalist>
                    ) : null}
                </>
            ) : null}
        </div>
    );
};

/** A labelled row of the rule form. */
export const FormRow = ({
    label,
    hint,
    children,
    aside,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
    aside?: ReactNode;
}) => (
    <div className="studio-spec-row">
        <div className="studio-spec-row-label">
            <span title={hint}>{label}</span>
            {aside}
        </div>
        <div className="studio-spec-row-body">{children}</div>
    </div>
);

/**
 * A JVAL expression (`_RETURN_` / `_CONTINUE_`): edited as text, checked as
 * you type, applied on blur or ⌘↵. Shows the operators and what it reads as.
 */
export const ExpressionField = ({
    value,
    onCommit,
    variables,
    preview,
    placeholder,
}: {
    value: string;
    onCommit: (value: string) => void;
    variables: string[];
    preview?: ReactNode;
    placeholder?: string;
}) => {
    const [draft, setDraft] = useState<string | null>(null);
    const shown = draft ?? value;
    const check = useMemo(() => (shown.trim() ? tryParseJval(shown) : null), [shown]);
    const unknown = useMemo(
        () =>
            check && "ast" in check
                ? jvalVariables(check.ast).filter((name) => !variables.includes(name))
                : [],
        [check, variables]
    );
    const commit = () => {
        if (draft === null) return;
        if (draft !== value) onCommit(draft);
        setDraft(null);
    };
    return (
        <div className="studio-spec-expr">
            <textarea
                className="bp-input studio-mono"
                rows={2}
                value={shown}
                placeholder={placeholder}
                spellCheck={false}
                aria-invalid={check && "error" in check ? true : undefined}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        commit();
                    }
                    if (e.key === "Escape") setDraft(null);
                }}
            />
            {check && "error" in check ? (
                <p className="studio-spec-expr-error">
                    {check.error} (at {check.at + 1})
                </p>
            ) : unknown.length ? (
                <p className="studio-spec-expr-warn">
                    Not declared on this test:{" "}
                    {unknown.map((n) => (
                        <code key={n}>{n}</code>
                    ))}
                </p>
            ) : preview ? (
                <p className="studio-spec-expr-preview">{preview}</p>
            ) : null}
            <p className="studio-spec-expr-ops">
                {[...UNARY_OPS, ...BINARY_OPS].map((op) => (
                    <code key={op}>{op}</code>
                ))}
                <code>&amp;&amp;</code>
                <code>||</code>
                <code>!( )</code>
            </p>
        </div>
    );
};

/** A JSONPath, with the request schema's paths as suggestions. Applied on blur / Enter. */
export const PathInput = ({
    value,
    onCommit,
    suggestions,
    placeholder = "$.message.…",
    onShow,
}: {
    value: string;
    onCommit: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    /** Show this path in the schema. */
    onShow?: () => void;
}) => {
    const [draft, setDraft] = useState<string | null>(null);
    const listId = useId();
    const shown = draft ?? value;
    const commit = () => {
        if (draft !== null && draft !== value) onCommit(draft);
        setDraft(null);
    };
    return (
        <div className="studio-spec-path-input">
            <input
                className="bp-input studio-mono"
                value={shown}
                placeholder={placeholder}
                list={listId}
                spellCheck={false}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") setDraft(null);
                }}
            />
            <datalist id={listId}>
                {suggestions.slice(0, 400).map((s) => (
                    <option key={s} value={s} />
                ))}
            </datalist>
            {onShow ? (
                <button
                    type="button"
                    className="studio-key studio-key-xs"
                    onClick={onShow}
                    title="Show in schema"
                >
                    schema
                </button>
            ) : null}
        </div>
    );
};
