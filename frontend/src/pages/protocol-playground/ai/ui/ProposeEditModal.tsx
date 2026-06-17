import { useContext, useMemo } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { PiShieldStarBold } from "react-icons/pi";
import { MockRunner } from "@ondc/automation-mock-runner";

import Popup from "@components/ui/pop-up/pop-up";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";

import { usePendingApprovals } from "../hooks/use-pending-approvals";
import { diffStats, lineDiff, type DiffRow } from "../utils/line-diff";

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
            <div className="text-[11px] italic text-gray-500 px-2 py-1">no changes detected</div>
        );
    }
    return (
        <div className="font-mono text-[11px] border border-gray-200 rounded overflow-hidden bg-white max-h-[55vh] overflow-y-auto">
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

export function ProposeEditModal() {
    const playground = useContext(PlaygroundContext);
    const approvals = usePendingApprovals();

    // Show the oldest pending approval that has propose-edit args. Approvals
    // without payload (legacy callers) are ignored here and will fall back to
    // any inline approval UI elsewhere.
    const current = useMemo(
        () => approvals.pending.find((p) => p.payload !== undefined),
        [approvals.pending]
    );

    const oldCode = useMemo(() => {
        if (!current?.payload || !playground.config) return "";
        const step = playground.config.steps.find((s) => s.action_id === current.payload!.step_id);
        if (!step) return "";
        const raw = step.mock[current.payload.file];
        if (!raw) return "";
        try {
            return MockRunner.decodeBase64(raw);
        } catch {
            return "";
        }
    }, [current, playground.config]);

    const newCode = current?.payload?.new_code ?? "";
    const rows = useMemo(() => lineDiff(oldCode, newCode), [oldCode, newCode]);
    const stats = useMemo(() => diffStats(rows), [rows]);

    if (!current?.payload) return null;

    const { step_id, file, rationale } = current.payload;
    const queueLen = approvals.pending.filter((p) => p.payload).length;

    const close = () => {
        approvals.resolve(current.toolCallId, false);
    };

    return (
        <Popup isOpen={true} onClose={close}>
            <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2 pr-12">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-linear-to-br from-amber-400 to-amber-600 text-white shrink-0">
                        <PiShieldStarBold className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-base font-semibold text-gray-900">
                            Approve code edit
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono truncate">
                            {step_id} · {file}
                        </span>
                    </div>
                    {queueLen > 1 && (
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            {queueLen} pending
                        </span>
                    )}
                </div>

                {rationale && (
                    <div className="text-[12px] text-gray-800 italic bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        {rationale}
                    </div>
                )}

                <div className="flex items-center gap-3 text-[11px] text-gray-600 font-mono">
                    <span className="text-emerald-700">+{stats.added}</span>
                    <span className="text-red-700">−{stats.removed}</span>
                    <span className="text-gray-500">
                        {rows.length} line{rows.length === 1 ? "" : "s"}
                    </span>
                </div>

                <DiffViewer rows={rows} />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => approvals.resolve(current.toolCallId, false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        <FaTimes className="h-3 w-3" /> Reject
                    </button>
                    <button
                        type="button"
                        onClick={() => approvals.resolve(current.toolCallId, true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <FaCheck className="h-3 w-3" /> Approve
                    </button>
                </div>
            </div>
        </Popup>
    );
}
