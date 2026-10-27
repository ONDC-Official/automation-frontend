import { useId, useState, type ReactNode } from "react";

/** A titled group of fields in the properties form. */
export const PropSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="bp-props-section">
        <p className="studio-eyebrow">{title}</p>
        <div className="bp-props-grid">{children}</div>
    </section>
);

interface FieldShellProps {
    label: string;
    hint?: string;
    error?: string | null;
    wide?: boolean;
    children: (id: string) => ReactNode;
}

const FieldShell = ({ label, hint, error, wide, children }: FieldShellProps) => {
    const id = useId();
    return (
        <div className="bp-field" data-wide={wide || undefined}>
            <label htmlFor={id} className="bp-field-label" title={hint}>
                {label}
            </label>
            {children(id)}
            {error ? <p className="bp-field-error">{error}</p> : null}
        </div>
    );
};

interface TextFieldProps {
    label: string;
    hint?: string;
    value: string;
    placeholder?: string;
    wide?: boolean;
    mono?: boolean;
    multiline?: boolean;
    /** Live edits; use `onCommit` instead for fields that may be rejected. */
    onChange?: (value: string) => void;
    /** Called on blur / Enter; returns an error to keep the draft open, or null. */
    onCommit?: (value: string) => string | null;
}

/** A text box. With `onCommit` it edits a draft that is applied on blur or Enter. */
export const TextField = ({
    label,
    hint,
    value,
    placeholder,
    wide,
    mono,
    multiline,
    onChange,
    onCommit,
}: TextFieldProps) => {
    const [draft, setDraft] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const shown = draft ?? value;

    const commit = () => {
        if (draft === null || !onCommit) return;
        const problem = onCommit(draft);
        setError(problem);
        if (!problem) setDraft(null);
    };

    const common = {
        className: `bp-input${mono ? " studio-mono" : ""}`,
        value: shown,
        placeholder,
        spellCheck: false,
        "aria-invalid": error ? true : undefined,
        onChange: (e: { target: { value: string } }) => {
            if (onCommit) setDraft(e.target.value);
            else onChange?.(e.target.value);
        },
        onBlur: commit,
    };

    return (
        <FieldShell label={label} hint={hint} error={error} wide={wide || multiline}>
            {(id) =>
                multiline ? (
                    <textarea id={id} rows={3} {...common} />
                ) : (
                    <input
                        id={id}
                        type="text"
                        autoComplete="off"
                        {...common}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                            if (e.key === "Escape") {
                                setDraft(null);
                                setError(null);
                            }
                        }}
                    />
                )
            }
        </FieldShell>
    );
};

interface SelectFieldProps<T extends string> {
    label: string;
    hint?: string;
    value: T;
    options: { value: T; label: string }[];
    wide?: boolean;
    onChange: (value: T) => void;
}

export const SelectField = <T extends string>({
    label,
    hint,
    value,
    options,
    wide,
    onChange,
}: SelectFieldProps<T>) => (
    <FieldShell label={label} hint={hint} wide={wide}>
        {(id) => (
            <select
                id={id}
                className="bp-input"
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )}
    </FieldShell>
);

export const CheckField = ({
    label,
    hint,
    checked,
    disabled,
    onChange,
}: {
    label: string;
    hint?: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) => (
    <label className="bp-check" title={hint} data-disabled={disabled || undefined}>
        <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
        {hint ? <span className="bp-check-hint">{hint}</span> : null}
    </label>
);

const toJson = (value: unknown) => (value === undefined ? "" : JSON.stringify(value, null, 2));

/**
 * Free JSON (examples). Applied as soon as it parses; an empty
 * box means "unset". Remount it (key) when the node changes.
 */
export const JsonField = ({
    label,
    hint,
    value,
    placeholder,
    validate,
    onChange,
}: {
    label: string;
    hint?: string;
    value: unknown;
    placeholder?: string;
    /** Rejects parsed JSON of the wrong shape: returns an error, or null. */
    validate?: (value: unknown) => string | null;
    onChange: (value: unknown) => void;
}) => {
    const [draft, setDraft] = useState(() => toJson(value));
    const [error, setError] = useState<string | null>(null);

    return (
        <FieldShell label={label} hint={hint} error={error} wide>
            {(id) => (
                <textarea
                    id={id}
                    className="bp-input studio-mono bp-json"
                    rows={Math.min(10, Math.max(3, draft.split("\n").length))}
                    value={draft}
                    placeholder={placeholder}
                    spellCheck={false}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => {
                        const text = e.target.value;
                        setDraft(text);
                        if (text.trim() === "") {
                            setError(null);
                            onChange(undefined);
                            return;
                        }
                        try {
                            const parsed: unknown = JSON.parse(text);
                            const problem = validate?.(parsed) ?? null;
                            setError(problem);
                            if (!problem) onChange(parsed);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : "Invalid JSON");
                        }
                    }}
                />
            )}
        </FieldShell>
    );
};

/** Comma-separated words, e.g. usecases. */
export const splitList = (text: string) =>
    text
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
