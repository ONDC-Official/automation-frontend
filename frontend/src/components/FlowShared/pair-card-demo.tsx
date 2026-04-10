/**
 * PairedCardDemo — renders one example of every card status variant.
 * Import and drop this anywhere to preview the full set of states.
 *
 * Usage:  <PairedCardDemo />
 */

import PairedCard from "@components/FlowShared/pair-card";
import { PairedStep } from "@components/FlowShared/mapped-flow";
import { MappedStep } from "@/types/flow-state-type";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function step(overrides: Partial<MappedStep> & { actionType: string }): MappedStep {
    const { actionType, ...rest } = overrides;
    return {
        status: "WAITING",
        actionId: actionType,
        owner: "BAP",
        actionType,
        index: 0,
        unsolicited: false,
        pairActionId: null,
        description: `Description for ${actionType}`,
        ...rest,
    };
}

function paired(first: MappedStep, second?: MappedStep): PairedStep {
    return { first, second };
}

// ---------------------------------------------------------------------------
// Mock data — one row per status variant
// ---------------------------------------------------------------------------

const DEMO_FLOW_ID = "demo-flow";

const rows: Array<{ label: string; pairedStep: PairedStep }> = [
    {
        label: "WAITING (unpaired — full width)",
        pairedStep: paired(step({ actionType: "search", status: "WAITING", index: 0 })),
    },
    {
        label: "LISTENING + RESPONDING (paired)",
        pairedStep: paired(
            step({ actionType: "select", status: "LISTENING", index: 2 }),
            step({ actionType: "on_select", status: "RESPONDING", index: 3, owner: "BPP" })
        ),
    },
    {
        label: "SUCCESS (ACK) + ERROR (NACK) (paired)",
        pairedStep: paired(
            step({
                actionType: "init",
                status: "COMPLETE",
                index: 4,
                payloads: {
                    entryType: "API",
                    action: "init",
                    messageId: "msg-001",
                    timestamp: new Date().toISOString(),
                    subStatus: "SUCCESS",
                    payloads: [{ payloadId: "p1", response: {} as never }],
                },
            }),
            step({
                actionType: "on_init",
                status: "COMPLETE",
                index: 5,
                owner: "BPP",
                payloads: {
                    entryType: "API",
                    action: "on_init",
                    messageId: "msg-002",
                    timestamp: new Date().toISOString(),
                    subStatus: "ERROR",
                    payloads: [{ payloadId: "p2", response: {} as never }],
                },
            })
        ),
    },
    {
        label: "INPUT-REQUIRED (unpaired)",
        pairedStep: paired(step({ actionType: "confirm", status: "INPUT-REQUIRED", index: 6 })),
    },
    {
        label: "PROCESSING + WAITING-SUBMISSION (paired)",
        pairedStep: paired(
            step({ actionType: "status", status: "PROCESSING", index: 7 }),
            step({ actionType: "on_status", status: "WAITING-SUBMISSION", index: 8, owner: "BPP" })
        ),
    },
    {
        label: "Unsolicited + with label + timestamp (paired)",
        pairedStep: paired(
            step({
                actionType: "on_update",
                status: "COMPLETE",
                index: 9,
                unsolicited: true,
                label: "partial cancel",
                owner: "BPP",
                payloads: {
                    entryType: "API",
                    action: "on_update",
                    messageId: "msg-003",
                    timestamp: new Date(Date.now() - 60_000).toISOString(),
                    subStatus: "SUCCESS",
                    payloads: [
                        { payloadId: "p3", response: {} as never },
                        { payloadId: "p4", response: {} as never },
                        { payloadId: "p5", response: {} as never },
                    ],
                },
            }),
            step({
                actionType: "update",
                status: "LISTENING",
                index: 10,
                label: "ack",
            })
        ),
    },
    {
        label: "Out-of-sequence (missed step)",
        pairedStep: paired(
            step({
                actionType: "cancel",
                status: "COMPLETE",
                index: 11,
                missedStep: true,
                payloads: {
                    entryType: "API",
                    action: "cancel",
                    messageId: "msg-004",
                    timestamp: new Date().toISOString(),
                    subStatus: "SUCCESS",
                    payloads: [{ payloadId: "p6", response: {} as never }],
                },
            })
        ),
    },
    {
        label: "High API count (×12, animated pulse)",
        pairedStep: paired(
            step({
                actionType: "on_track",
                status: "COMPLETE",
                index: 12,
                owner: "BPP",
                payloads: {
                    entryType: "API",
                    action: "on_track",
                    messageId: "msg-005",
                    timestamp: new Date().toISOString(),
                    subStatus: "SUCCESS",
                    payloads: Array.from({ length: 12 }, (_, i) => ({
                        payloadId: `p-track-${i}`,
                        response: {} as never,
                    })),
                },
            })
        ),
    },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PairedCardDemo() {
    return (
        <div className="min-h-screen bg-gray-50 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-gray-900">Paired Card — All Variants</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Showcasing every status and layout combination for{" "}
                        <code className="bg-gray-100 px-1 rounded text-xs">PairedCard</code>.
                    </p>
                </div>

                {/* Rows */}
                <div className="space-y-6">
                    {rows.map(({ label, pairedStep }) => (
                        <div key={label}>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                                {label}
                            </p>
                            <PairedCard pairedStep={pairedStep} flowId={DEMO_FLOW_ID} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
