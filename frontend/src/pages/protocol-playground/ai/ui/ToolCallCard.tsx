import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaCheckCircle,
    FaChevronDown,
    FaChevronRight,
    FaExclamationCircle,
    FaSpinner,
} from "react-icons/fa";
import AppJsonViewer from "@/components/AppJsonViewer";

import type { ToolMessage } from "../hooks/use-chat-session";

interface ToolCallCardProps {
    message: ToolMessage;
}

function formatArgs(argsJson: string): string {
    if (!argsJson || argsJson.trim() === "") return "{}";
    try {
        return JSON.stringify(JSON.parse(argsJson), null, 2);
    } catch {
        return argsJson;
    }
}

function tryParseJson(text: string | undefined): unknown | undefined {
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

// read_step_code / read_helper_lib return { content: "<source>", ...meta }.
// Show the source as a single code block instead of a JSON tree.
function extractCodeContent(parsed: unknown): {
    code: string;
    language?: string;
    meta?: Record<string, unknown>;
} | null {
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.content !== "string") return null;
    const language = typeof obj.language === "string" ? obj.language : undefined;
    const meta: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k !== "content") meta[k] = v;
    }
    return { code: obj.content, language, meta };
}

export function ToolCallCard({ message }: ToolCallCardProps) {
    const [expanded, setExpanded] = useState<boolean>(message.status !== "done");
    const userToggledRef = useRef(false);
    const prevStatusRef = useRef(message.status);

    // Auto-collapse on the running→done transition unless the user has manually
    // toggled the card. Errors stay open so they don't get missed.
    useEffect(() => {
        const prev = prevStatusRef.current;
        if (prev !== message.status) {
            if (prev === "running" && message.status === "done" && !userToggledRef.current) {
                setExpanded(false);
            } else if (message.status === "error") {
                setExpanded(true);
            }
            prevStatusRef.current = message.status;
        }
    }, [message.status]);

    const args = useMemo(() => formatArgs(message.argsJson), [message.argsJson]);
    const parsedResult = useMemo(
        () => (message.status === "done" ? tryParseJson(message.resultText) : undefined),
        [message.status, message.resultText]
    );
    const codeContent = useMemo(() => extractCodeContent(parsedResult), [parsedResult]);

    const headerColor =
        message.status === "error"
            ? "border-red-300 bg-red-50"
            : message.status === "done"
              ? "border-emerald-200 bg-emerald-50"
              : "border-sky-200 bg-sky-50";

    const StatusIcon =
        message.status === "error"
            ? FaExclamationCircle
            : message.status === "done"
              ? FaCheckCircle
              : FaSpinner;
    const iconClass =
        message.status === "error"
            ? "text-red-600"
            : message.status === "done"
              ? "text-emerald-600"
              : "text-sky-600 animate-spin";

    const handleToggle = () => {
        userToggledRef.current = true;
        setExpanded((v) => !v);
    };

    return (
        <div
            className={`self-start max-w-[95%] w-full border rounded-md text-xs ${headerColor} overflow-hidden`}
        >
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 text-left"
            >
                {expanded ? (
                    <FaChevronDown className="text-gray-500 shrink-0" />
                ) : (
                    <FaChevronRight className="text-gray-500 shrink-0" />
                )}
                <StatusIcon className={`shrink-0 ${iconClass}`} />
                <span className="font-mono font-semibold text-gray-800 truncate">
                    {message.toolName || "(tool)"}
                </span>
                <span className="text-gray-500 ml-auto shrink-0">
                    {message.status === "running"
                        ? "running…"
                        : message.status === "done"
                          ? "done"
                          : "error"}
                </span>
            </button>

            {expanded && (
                <div className="px-3 py-2 border-t border-black/10 bg-white flex flex-col gap-2">
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                            Arguments
                        </div>
                        <pre className="font-mono text-[11px] whitespace-pre-wrap wrap-break-word bg-gray-50 border border-gray-200 rounded p-2">
                            {args}
                        </pre>
                    </div>

                    {message.status === "running" && (
                        <div className="text-[11px] text-sky-700 italic">executing…</div>
                    )}

                    {message.status === "error" && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-red-600 mb-1">
                                Error
                            </div>
                            <pre className="font-mono text-[11px] whitespace-pre-wrap wrap-break-word bg-red-50 border border-red-200 rounded p-2 text-red-800">
                                {message.errorText ?? "(no message)"}
                            </pre>
                        </div>
                    )}

                    {message.status === "done" && message.resultText !== undefined && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                Result
                            </div>
                            {codeContent ? (
                                <div className="flex flex-col gap-1">
                                    {codeContent.meta &&
                                        Object.keys(codeContent.meta).length > 0 && (
                                            <div className="text-[11px] text-gray-600 font-mono">
                                                {Object.entries(codeContent.meta)
                                                    .map(
                                                        ([k, v]) =>
                                                            `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`
                                                    )
                                                    .join("  ·  ")}
                                            </div>
                                        )}
                                    <pre className="font-mono text-[11px] whitespace-pre-wrap wrap-break-word bg-gray-900 text-gray-100 border border-gray-800 rounded p-2 max-h-96 overflow-auto">
                                        {codeContent.code}
                                    </pre>
                                </div>
                            ) : parsedResult !== undefined &&
                              typeof parsedResult === "object" &&
                              parsedResult !== null ? (
                                <div className="bg-white border border-gray-200 rounded p-2 overflow-auto max-h-96">
                                    <AppJsonViewer value={parsedResult as object} collapsed={2} />
                                </div>
                            ) : (
                                <pre className="font-mono text-[11px] whitespace-pre-wrap wrap-break-word bg-gray-50 border border-gray-200 rounded p-2 max-h-96 overflow-auto">
                                    {message.resultText}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
