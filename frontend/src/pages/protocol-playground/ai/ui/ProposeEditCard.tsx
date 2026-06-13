import { useContext, useMemo, useState } from "react";
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaTimes,
} from "react-icons/fa";
import { PiShieldStarBold } from "react-icons/pi";
import MockRunner from "@ondc/automation-mock-runner";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";

import type { ToolMessage } from "../hooks/use-chat-session";
import { diffStats, lineDiff, type DiffRow } from "../utils/line-diff";

interface ProposeEditCardProps {
    message: ToolMessage;
}

type EditableFile = "generate" | "validate" | "requirements" | "formHtml";

interface ParsedArgs {
    step_id?: string;
    file?: EditableFile;
    new_code?: string;
    rationale?: string;
}

function parseArgs(json: string): ParsedArgs {
    if (!json || json.trim() === "") return {};
    try {
        return JSON.parse(json) as ParsedArgs;
    } catch {
        return {};
    }
}

const TONE_BY_OP: Record<DiffRow["op"], string> = {
    "+": "bg-emerald-50 text-emerald-900",
    "-": "bg-red-50 text-red-900",
    "=": "bg-white text-gray-700",
};
const SIGN_BY_OP: Record<DiffRow["op"], string> = {
    "+": "+",
    "-": "−",
    "=": " ",
};

function DiffViewer({ rows }: { rows: DiffRow[] }) {
    if (rows.length === 0) {
        return (
            <div className="text-[11px] italic text-gray-500 px-2 py-1">
                no changes detected
            </div>
        );
    }
    return (
        <div className="font-mono text-[11px] border border-gray-200 rounded overflow-hidden bg-white max-h-96 overflow-y-auto">
            {rows.map((row, idx) => (
                <div
                    key={idx}
                    className={`flex items-start gap-2 px-2 py-px ${TONE_BY_OP[row.op]}`}
                >
                    <span className="w-7 text-right text-gray-400 select-none shrink-0">
                        {row.oldNum ?? ""}
                    </span>
                    <span className="w-7 text-right text-gray-400 select-none shrink-0">
                        {row.newNum ?? ""}
                    </span>
                    <span className="w-3 select-none shrink-0">{SIGN_BY_OP[row.op]}</span>
                    <pre className="whitespace-pre-wrap wrap-break-word flex-1 m-0">
                        {row.text || " "}
                    </pre>
                </div>
            ))}
        </div>
    );
}

export function ProposeEditCard({ message }: ProposeEditCardProps) {
    const playground = useContext(PlaygroundContext);
    const [expanded, setExpanded] = useState(false);

    const args = useMemo(() => parseArgs(message.argsJson), [message.argsJson]);

    const oldCode = useMemo(() => {
        if (!playground.config || !args.step_id || !args.file) return "";
        const step = playground.config.steps.find((s) => s.action_id === args.step_id);
        if (!step) return "";
        const raw = step.mock[args.file];
        if (!raw) return "";
        try {
            return MockRunner.decodeBase64(raw);
        } catch {
            return "";
        }
    }, [playground.config, args.step_id, args.file]);

    const newCode = args.new_code ?? "";
    const rows = useMemo(() => lineDiff(oldCode, newCode), [oldCode, newCode]);
    const stats = useMemo(() => diffStats(rows), [rows]);

    const isPending = message.status === "running";
    const wasApplied =
        message.status === "done" &&
        message.resultText !== undefined &&
        /"applied"\s*:\s*true/.test(message.resultText);
    const wasRejected =
        message.status === "done" &&
        message.resultText !== undefined &&
        /"applied"\s*:\s*false/.test(message.resultText);
    const isError = message.status === "error";

    const tone = isError
        ? { border: "border-red-300 bg-red-50", icon: "text-red-600", label: "error" }
        : wasApplied
          ? {
                border: "border-emerald-300 bg-emerald-50",
                icon: "text-emerald-600",
                label: "applied",
            }
          : wasRejected
            ? {
                  border: "border-gray-300 bg-gray-50",
                  icon: "text-gray-500",
                  label: "rejected",
              }
            : {
                  border: "border-amber-300 bg-amber-50",
                  icon: "text-amber-600",
                  label: "awaiting approval (see modal)",
              };

    const StatusIcon = isError
        ? FaExclamationCircle
        : wasApplied
          ? FaCheckCircle
          : wasRejected
            ? FaTimes
            : PiShieldStarBold;

    return (
        <div
            className={`self-start w-full max-w-[95%] border rounded-md text-xs ${tone.border} overflow-hidden`}
        >
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 text-left"
            >
                <StatusIcon className={`shrink-0 ${tone.icon}`} />
                <span className="font-mono font-semibold text-gray-800 truncate">
                    propose_step_edit
                </span>
                {args.step_id && args.file && (
                    <span className="text-gray-600 truncate">
                        {args.step_id} · {args.file}
                    </span>
                )}
                <span className="ml-auto flex items-center gap-2 shrink-0 text-gray-600">
                    <span className="font-mono text-emerald-700">+{stats.added}</span>
                    <span className="font-mono text-red-700">−{stats.removed}</span>
                    <span className="text-gray-500">{tone.label}</span>
                </span>
            </button>

            {expanded && (
                <div className="px-3 py-2 border-t border-black/10 bg-white flex flex-col gap-2">
                    {args.rationale && (
                        <div className="text-[12px] text-gray-800 italic">
                            {args.rationale}
                        </div>
                    )}

                    {isError && (
                        <pre className="font-mono text-[11px] whitespace-pre-wrap wrap-break-word bg-red-50 border border-red-200 rounded p-2 text-red-800">
                            {message.errorText ?? "(no message)"}
                        </pre>
                    )}

                    <DiffViewer rows={rows} />

                    {isPending && (
                        <div className="text-[11px] text-amber-700 italic">
                            Approve or reject in the modal popup.
                        </div>
                    )}

                    {wasApplied && (
                        <div className="text-[11px] text-emerald-700 italic">
                            edit applied to {args.file} on step {args.step_id}.
                        </div>
                    )}
                    {wasRejected && (
                        <div className="text-[11px] text-gray-600 italic">
                            change rejected — nothing was modified.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
