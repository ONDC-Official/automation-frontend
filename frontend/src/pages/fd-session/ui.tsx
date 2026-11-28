import type { ReactNode } from "react";
import { Badge } from "@components/Shadcn/Badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info" | "alert" | "outline";

const TONE: Record<string, Tone> = {
    pass: "success",
    met: "success",
    VALID: "success",
    PASS: "success",
    FINISHED: "info",
    fail: "error",
    unmet: "error",
    REFUSED: "error",
    FAIL: "error",
    LAPSED: "alert",
    INCOMPLETE: "alert",
    RUNNING: "alert",
    STOPPED: "outline",
    info: "info",
    required: "info",
    "when-seen": "outline",
    excluded: "outline",
    "not-seen": "outline",
    "not-run": "outline",
    waived: "alert",
    skipped: "outline",
};

/** A status pill whose colour follows the word (pass, VALID, unmet, RUNNING, …). */
export const StatusBadge = ({ value, className }: { value: string; className?: string }) => (
    <Badge variant={TONE[value] ?? "outline"} className={cn("whitespace-nowrap", className)}>
        {value}
    </Badge>
);

export const KeyValue = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="min-w-0">
        <dt className="text-caption-1 uppercase tracking-wide text-n-300 dark:text-n-60">
            {label}
        </dt>
        <dd className="mt-0.5 break-all text-body-2 text-text-primary">{children}</dd>
    </div>
);

export const Mono = ({ children }: { children: ReactNode }) => (
    <code className="rounded bg-n-20 px-1.5 py-0.5 font-mono text-xs dark:bg-surface-muted">
        {children}
    </code>
);

export const Empty = ({ children }: { children: ReactNode }) => (
    <p className="rounded-lg border border-dashed border-n-30 p-6 text-center text-body-2 text-n-300 dark:border-border-default dark:text-n-60">
        {children}
    </p>
);

export const pretty = (text?: string) => {
    if (!text) return "";
    try {
        const s = JSON.stringify(JSON.parse(text), null, 2);
        return s.length > 40_000
            ? `${s.slice(0, 40_000)}\n… (${s.length - 40_000} more characters)`
            : s;
    } catch {
        return text.length > 4000 ? `${text.slice(0, 4000)}…` : text;
    }
};

export const time = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

/** The message an RTK Query error carries (our backend relays the workbench's own words). */
export const errorText = (e: unknown) =>
    (e as { message?: string; data?: { message?: string } })?.data?.message ??
    (e as { message?: string })?.message ??
    "Something went wrong";

/** The catalogue's scenario text is Markdown: `code`, **bold** and [links](…). Shown as text with code marked. */
export const ScenarioText = ({ text }: { text: string }) => (
    <>
        {text
            .replace(/\*\*/g, "")
            .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
            .split("`")
            .map((part, i) => (i % 2 ? <Mono key={i}>{part}</Mono> : <span key={i}>{part}</span>))}
    </>
);
