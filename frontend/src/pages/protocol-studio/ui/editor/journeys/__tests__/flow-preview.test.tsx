import { render, screen } from "@testing-library/react";
import type { RunFailureCauseV2 } from "@ondc/automation-mock-runner";

import type { StudioRun, StudioRunActions } from "@pages/protocol-studio/hooks/use-studio-run";
import { FlowPreview } from "@pages/protocol-studio/ui/editor/journeys/flow-preview";

const run = (cause?: RunFailureCauseV2): StudioRun =>
    ({
        active: true,
        journeyId: null,
        session: { transactionId: "t-1", mode: "open", events: [], decisions: {}, counters: {} },
        // One step ran, and the run stopped after it.
        runs: [
            {
                nodeId: "on_status",
                kind: "unsolicited",
                ok: true,
                event: { api: "on_status", messageId: "m-1" },
            },
        ],
        status: {},
        next: null,
        pending: null,
        busy: false,
        stale: false,
        deviation: null,
        failure: { nodeId: "on_status", reason: "It stopped", ...(cause ? { cause } : {}) },
        finished: false,
        sessionData: {},
        provenance: {},
        lastSaved: {},
        recognitions: {},
        selectedRun: null,
        blocked: null,
    }) as unknown as StudioRun;

const show = (cause?: RunFailureCauseV2) =>
    render(
        <FlowPreview
            journey={null}
            walk={null}
            openMode
            run={run(cause)}
            actions={{} as StudioRunActions}
            onShowRun={() => {}}
        />
    );

describe("FlowPreview: a failed run", () => {
    it.each([
        ["exit", "Exit condition never met"],
        ["repeat", "Repeat limit reached"],
        ["no-wire", "The decision's case has no wire"],
        ["requirements", "Requirements not met"],
    ] as const)("words a %s failure by its cause", (cause, title) => {
        show(cause);
        const alert = document.querySelector('[data-alert="failure"]');
        expect(alert?.getAttribute("data-cause")).toBe(cause);
        expect(alert?.textContent).toContain(title);
        expect(screen.getByText(new RegExp(`stopped: ${title.toLowerCase()}`))).toBeTruthy();
    });

    it("words a failure without a cause as before", () => {
        show();
        const alert = document.querySelector('[data-alert="failure"]');
        expect(alert?.hasAttribute("data-cause")).toBe(false);
        expect(alert?.textContent).toContain("Exit condition never met");
    });
});
