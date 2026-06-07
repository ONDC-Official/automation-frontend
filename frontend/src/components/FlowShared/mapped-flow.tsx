import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { IoPlay } from "react-icons/io5";

import { FlowMap, MappedStep } from "@/types/flow-state-type";
import FormConfig, { FormConfigType } from "@components/ui/forms/config-form/config-form";
import Popup from "@components/ui/pop-up/pop-up";
import CustomTooltip from "@components/ui/mini-components/tooltip";
import { SequenceStep, SubmitEventParams } from "@/types/flow-types";
import { proceedFlow, triggerExtra } from "@utils/request-utils";
import { useSession } from "@context/context";

import PairedCard from "@components/FlowShared/pair-card";
import { isTrackingPhaseStep, isTrackingActive } from "@components/FlowShared/ride-map-utils";

export default function DisplayFlow({
    mappedFlow,
    flowId,
}: {
    mappedFlow: FlowMap;
    flowId: string;
}) {
    // mappedFlow = dummy;
    const steps = getOrderedSteps(mappedFlow);
    const extraSteps = getOrderedSteps({
        sequence: mappedFlow.extraSteps ?? [],
        missedSteps: [],
        reference_data: mappedFlow.reference_data,
    });
    const [inputPopUp, setInputPopUp] = useState(false);
    const [activeFormConfig, setActiveFormConfig] = useState<FormConfigType | undefined>(undefined);
    // When the auto-opened input form belongs to an extra step, its trigger key is held here so
    // submission routes through triggerExtra (sends `trigger_extra`) instead of proceedFlow.
    const [activeInputExtraKey, setActiveInputExtraKey] = useState<string | undefined>(undefined);
    // Signature of the step whose form is currently open, and of the last step we submitted.
    // After a successful submit the backend may keep reporting that step as INPUT-REQUIRED for a
    // few polls; we suppress re-opening it until the target becomes a different step (or none).
    const activeInputSigRef = useRef<string | undefined>(undefined);
    const submittedInputSigRef = useRef<string | undefined>(undefined);

    // User-initiated "extra trigger" popup — kept separate from the auto-open INPUT-REQUIRED popup.
    const [extraPopUp, setExtraPopUp] = useState(false);
    const [extraFormConfig, setExtraFormConfig] = useState<FormConfigType | undefined>(undefined);
    const [activeExtraKey, setActiveExtraKey] = useState<string | undefined>(undefined);
    const [triggeringKey, setTriggeringKey] = useState<string | undefined>(undefined);

    const { sessionId, sessionData, activeFlowId, autoScrollEnabled } = useSession();

    // Auto-scroll bookkeeping: DOM node per step signature, previous poll's status map, and a guard
    // so we don't scroll on the initial mount (everything would look "new").
    const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const prevStatusRef = useRef<Map<string, MappedStep["status"]>>(new Map());
    const scrollInitedRef = useRef(false);
    // `sig|status` of the last step we scrolled to — so polling never re-scrolls the same step in
    // the same status (belt-and-suspenders against any residual re-flagging).
    const lastScrolledKeyRef = useRef<string | undefined>(undefined);

    const transactionId = sessionData?.flowMap[flowId] ?? undefined;
    // Counterparty-owned extra-sequence steps that can be fired on demand (e.g. on_track /
    // on_status). These remain visible as "Extra Trigger" buttons alongside the ride map.
    const eligibleExtras = (sessionData?.flowConfigs?.[flowId]?.extraSequence ?? []).filter(
        (s) => s.owner !== sessionData?.npType
    );

    // --- Real-Time Ride Map Integration ------------------------------------
    // The map UI now lives in the right-panel "Application" tab (RideMapTab). Here we only need to
    // know whether the tracking phase is active, to stop the flow engine auto-proceeding past
    // on_confirm — the seller drives track/on_track/on_status manually from the map.
    const trackingActive = isTrackingActive(mappedFlow);

    useEffect(() => {
        // Sequence steps (skip first — that's the flow's initial trigger) take priority over extras.
        const seqStep = mappedFlow?.sequence?.filter(
            (s, index) => s.status === "INPUT-REQUIRED" && index !== 0
        )?.[0];
        const extraStep = mappedFlow?.extraSteps?.find((s) => s.status === "INPUT-REQUIRED");
        const target = seqStep ?? extraStep;
        const conf = target?.input;
        // Ride Map (Part A): once the ride is assigned (on_confirm complete), the tracking phase is
        // fully manual — do NOT auto-open/auto-submit input for track/on_track/on_status/etc. The
        // seller advances these via the map controls. EXCEPTION: `on_track_on_assign` shares the
        // initial driver location and is seller-input-driven, so let its input form auto-open.
        if (
            trackingActive &&
            isTrackingPhaseStep(target?.actionType) &&
            target?.actionId !== "on_track_on_assign"
        )
            return;
        // Extra steps must be advanced via triggerExtra (carries `trigger_extra`); use the step's
        // actionId as the trigger key. Undefined => sequence step => proceedFlow.
        const extraKey = !seqStep && extraStep ? extraStep.actionId : undefined;

        const sig = target ? stepSignature(target) : undefined;
        // Same step we just submitted is still lagging on the backend — don't re-open it.
        if (sig && sig === submittedInputSigRef.current) return;
        // Target moved on (different step or none) — drop the suppression and proceed.
        submittedInputSigRef.current = undefined;
        activeInputSigRef.current = sig;

        if (conf?.length === 0) {
            if (sessionData?.activeFlow !== flowId) return;
            setActiveInputExtraKey(extraKey);
            handleFormSubmit({ jsonPath: {}, formData: {} }, extraKey);
            return;
        }
        setActiveInputExtraKey(extraKey);
        setActiveFormConfig(conf);
        if (conf) {
            setInputPopUp(true);
        }
    }, [mappedFlow]);

    useEffect(() => {
        const latestSending = mappedFlow?.sequence.find((f) => f.status === "RESPONDING");
        const transactionId = sessionData?.flowMap[flowId];
        // Ride Map (Part A): never auto-proceed tracking-phase steps after on_confirm — the seller
        // drives them manually via the map.
        if (trackingActive && isTrackingPhaseStep(latestSending?.actionType)) return;
        if (latestSending && latestSending.force_proceed && transactionId) {
            proceedFlow(sessionId, transactionId);
        }
    }, [mappedFlow]);

    // Scroll the most-recently activated step into view (only if it's off-screen) on each poll.
    useEffect(() => {
        // Flatten to the on-screen render order: sequence/missed rows first, then extra rows.
        const orderedSteps = [...steps, ...extraSteps].flatMap((p) =>
            p.second ? [p.first, p.second] : [p.first]
        );
        const currentMap = new Map(orderedSteps.map((s) => [stepSignature(s), s.status]));

        // First run only seeds the baseline — don't scroll to everything on mount.
        if (!scrollInitedRef.current) {
            scrollInitedRef.current = true;
            prevStatusRef.current = currentMap;
            return;
        }

        // Last step (in render order) that newly appeared or changed status INTO a meaningful state.
        // Iterate the DEDUPED currentMap, NOT orderedSteps: a signature can alias across the
        // sequence/missed/extra arrays, and comparing a first-occurrence status against the deduped
        // previous status would read as "changed" every poll and scroll endlessly. Steps entering as
        // WAITING are ignored — the backend reveals upcoming placeholder steps as the flow runs.
        let targetSig: string | undefined;
        let targetStatus: MappedStep["status"] | undefined;
        for (const [sig, status] of currentMap) {
            const prev = prevStatusRef.current.get(sig);
            const changed = prev === undefined || prev !== status;
            if (changed && status !== "WAITING") {
                targetSig = sig;
                targetStatus = status;
            }
        }
        prevStatusRef.current = currentMap;

        // Gate: skip when the user disabled auto-scroll, when nothing activated, or for a background
        // flow (only the active flow polls/progresses, so this stops other flows yanking the view).
        if (!targetSig || activeFlowId !== flowId || autoScrollEnabled === false) return;

        // Never scroll twice for the same step in the same status — guards any residual re-flagging
        // from polling so the view doesn't keep yanking when nothing actually advanced.
        const scrollKey = `${targetSig}|${targetStatus}`;
        if (scrollKey === lastScrolledKeyRef.current) return;
        lastScrolledKeyRef.current = scrollKey;

        const el = stepRefs.current.get(targetSig);
        if (!el) return;
        // Skip when the step sits inside a collapsed accordion (clientHeight 0) — nothing to reveal.
        const acc = el.closest('[id^="accordion-content-"]') as HTMLElement | null;
        if (acc && acc.clientHeight === 0) return;

        // Resolve the real scroll parent (this page scrolls the window, not an inner container — see
        // render-flows min-h-screen) and its visible band in viewport coordinates.
        const scroller = getScrollParent(el);
        const viewTop = scroller ? scroller.getBoundingClientRect().top : 0;
        const viewBottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;

        const rect = el.getBoundingClientRect();
        // Already fully visible → leave it (avoids re-centering on every poll).
        if (rect.top >= viewTop && rect.bottom <= viewBottom) return;

        // Center the step in the visible band. The exact delta behaves identically scrolling up or
        // down and never stops short of the step; the browser clamps it near the scroll extremes.
        const delta = rect.top + rect.height / 2 - (viewTop + viewBottom) / 2;
        if (scroller) scroller.scrollBy({ top: delta, behavior: "smooth" });
        else window.scrollBy({ top: delta, behavior: "smooth" });
    }, [mappedFlow]);

    // Register/unregister a row's DOM node under both of its steps' signatures so the scroll effect
    // can locate it (a changed `second` step is findable too).
    const registerRow = (pairedStep: PairedStep) => (el: HTMLDivElement | null) => {
        [pairedStep.first, pairedStep.second]
            .filter((s): s is MappedStep => Boolean(s))
            .map(stepSignature)
            .forEach((sig) => (el ? stepRefs.current.set(sig, el) : stepRefs.current.delete(sig)));
    };

    const handleFormSubmit = async (formData: SubmitEventParams, extraKey?: string) => {
        try {
            const txId = sessionData?.flowMap[flowId];
            if (!txId) {
                console.error("Transaction ID not found");
                return;
            }
            // Pass extraKey explicitly for the immediate auto-submit path (state not yet flushed);
            // popup submissions fall back to the stored key set when the form opened.
            const key = extraKey ?? activeInputExtraKey;
            if (key) {
                await triggerExtra(sessionId, txId, key, formData.formData);
            } else {
                await proceedFlow(sessionId, txId, formData.jsonPath, formData.formData);
            }
            // Remember what we submitted so the auto-open effect won't re-open it while the
            // backend still reports it as INPUT-REQUIRED on the next poll(s).
            submittedInputSigRef.current = activeInputSigRef.current;
            setInputPopUp(false);
            setActiveFormConfig(undefined);
            setActiveInputExtraKey(undefined);
        } catch (error) {
            toast.error("Error submitting form ");
            console.error("Error submitting form data:", error);
            setInputPopUp(false);
        }
    };

    const fireExtra = async (key: string, inputs?: Record<string, string>) => {
        if (!transactionId) {
            toast.info("Start the flow first");
            return;
        }
        setTriggeringKey(key);
        try {
            await triggerExtra(sessionId, transactionId, key, inputs);
            toast.success(`Triggered ${key}`);
        } catch (error) {
            toast.error("Error triggering extra step");
            console.error("Error triggering extra step:", error);
        } finally {
            setTriggeringKey(undefined);
        }
    };

    const handleTriggerExtra = (extra: SequenceStep) => {
        if (!transactionId) {
            toast.info("Start the flow first");
            return;
        }
        if (extra.input && extra.input.length > 0) {
            setExtraFormConfig(extra.input);
            setActiveExtraKey(extra.key);
            setExtraPopUp(true);
            return;
        }
        fireExtra(extra.key);
    };

    const closeExtraPopUp = () => {
        setExtraPopUp(false);
        setExtraFormConfig(undefined);
        setActiveExtraKey(undefined);
    };

    const handleExtraSubmit = async (formData: SubmitEventParams) => {
        if (!activeExtraKey) return;
        await fireExtra(activeExtraKey, formData.formData);
        closeExtraPopUp();
    };

    return (
        <>
            {eligibleExtras.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-5 bg-sky-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-sky-700">Extra Triggers</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {eligibleExtras.map((extra) => (
                            <ExtraTriggerButton
                                key={extra.key}
                                extra={extra}
                                disabled={!transactionId}
                                loading={triggeringKey === extra.key}
                                onTrigger={() => handleTriggerExtra(extra)}
                            />
                        ))}
                    </div>
                </div>
            )}
            <div>
                {steps.map((pairedStep) => (
                    <div
                        key={stepSignature(pairedStep.first)}
                        ref={registerRow(pairedStep)}
                    >
                        <PairedCard pairedStep={pairedStep} flowId={flowId} />
                    </div>
                ))}
            </div>
            {extraSteps.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-amber-700">Extra Steps</h3>
                    </div>
                    {extraSteps.map((pairedStep) => (
                        <div
                            key={`extra-${stepSignature(pairedStep.first)}`}
                            ref={registerRow(pairedStep)}
                        >
                            <PairedCard pairedStep={pairedStep} flowId={flowId} />
                        </div>
                    ))}
                </div>
            )}
            {inputPopUp && activeFormConfig && (
                <Popup isOpen={inputPopUp} disableClose>
                    <FormConfig
                        formConfig={activeFormConfig}
                        submitEvent={handleFormSubmit}
                        referenceData={mappedFlow.reference_data}
                        flowId={flowId}
                    />
                </Popup>
            )}
            {extraPopUp && extraFormConfig && (
                <Popup isOpen={extraPopUp} onClose={closeExtraPopUp}>
                    <FormConfig
                        formConfig={extraFormConfig}
                        submitEvent={handleExtraSubmit}
                        referenceData={mappedFlow.reference_data}
                        flowId={flowId}
                    />
                </Popup>
            )}
        </>
    );
}

function ExtraTriggerButton({
    extra,
    disabled,
    loading,
    onTrigger,
}: {
    extra: SequenceStep;
    disabled: boolean;
    loading: boolean;
    onTrigger: () => void;
}) {
    const hasInput = !!extra.input && extra.input.length > 0;
    const label = extra.label ?? extra.type;
    const tooltip = disabled
        ? "Start the flow to trigger this step"
        : (extra.description ?? `Trigger ${extra.key}`);
    return (
        <CustomTooltip content={tooltip}>
            <button
                type="button"
                disabled={disabled || loading}
                onClick={onTrigger}
                className="flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700 transition-all duration-150 hover:bg-sky-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                ) : (
                    <IoPlay className="text-sm" />
                )}
                <span>{label}</span>
                {hasInput && (
                    <span className="rounded-full border border-sky-200 bg-white/80 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky-700">
                        input
                    </span>
                )}
            </button>
        </CustomTooltip>
    );
}

export type PairedStep = {
    first: MappedStep;
    second?: MappedStep;
};

// Stable identity for a step across polls — used for INPUT-REQUIRED suppression, change detection,
// and ref/React keys. The `m`/`s` prefix separates a missed step from a sequence step that happens
// to share actionId+index; extra steps carry index === -1 (sequence >= 0) so never collide, and
// differ from each other by actionId.
function stepSignature(step: MappedStep): string {
    return `${step.missedStep ? "m" : "s"}|${step.actionId}|${step.index}`;
}

// Nearest actually-scrolling ancestor, or null when the window/document is the scroller.
function getScrollParent(el: HTMLElement): HTMLElement | null {
    let parent = el.parentElement;
    while (parent) {
        const overflowY = getComputedStyle(parent).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

function getOrderedSteps(mappedFlow: FlowMap): PairedStep[] {
    const sequence = [...mappedFlow.sequence, ...mappedFlow.missedSteps];
    // Track visited steps by array position, not `actionId_index`: extra steps all carry
    // index === -1, so duplicate actionIds would otherwise collide and get dropped.
    const visited = new Set<number>();
    const steps: PairedStep[] = [];

    for (let i = 0; i < sequence.length; i++) {
        if (visited.has(i)) continue;
        visited.add(i);
        const step = sequence[i];

        let pairStep: MappedStep | undefined;
        if (step.pairActionId) {
            const pairIndex = sequence.findIndex(
                (s, j) => !visited.has(j) && s.actionId === step.pairActionId
            );
            if (pairIndex !== -1) {
                visited.add(pairIndex);
                pairStep = sequence[pairIndex];
            }
        }

        steps.push({
            first: step,
            second: pairStep,
        });
    }

    return steps.sort((a, b) => {
        return a.first.index - b.first.index;
    });
}
