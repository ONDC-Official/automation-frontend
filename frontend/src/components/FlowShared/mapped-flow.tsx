import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IoPlay } from "react-icons/io5";
import { FlowMap, MappedStep } from "@/types/flow-state-type";
import FormFlowDialog from "@/components/Shadcn/Dialog/form-flow-dialog";
import { FormConfig, FormConfigType, FormFieldConfigType } from "@/components/ui/forms/config-form";
import FormLaunchPopup from "@components/ui/forms/custom-forms/form-launch-popup";
import { TooltipHint } from "@/components/Shadcn/Tooltip";
import { SequenceStep, SubmitEventParams } from "@/types/flow-types";
import { proceedFlow, triggerExtra } from "@utils/request-utils";
import { useSession } from "@context/context";

import PairedCard from "@components/FlowShared/pair-card";
import {
    isTrackingPhaseStep,
    isTrackingActive,
    isRideMapEnabled,
} from "@components/FlowShared/ride-map-utils";

// LAMF single-redirection flow: its MANUAL_DYNAMIC_FORM form is launched from a
// separate one-button popup as soon as the FIRST on_select completes (this flow
// has a second on_select after on_status — that one must NOT trigger it). Scoped
// strictly by flow id so no other flow's behavior changes.
// const LAMF_SINGLE_REDIRECTION_FLOW_ID = "lamf_credit_line_with_mfc_single_redirection";

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
    const [activeFormTitle, setActiveFormTitle] = useState<string | undefined>(undefined);
    const [activeReferenceData, setActiveReferenceData] = useState<
        FlowMap["reference_data"] | undefined
    >(undefined);
    // When the auto-opened input form belongs to an extra step, its trigger key is held here so
    // submission routes through triggerExtra (sends `trigger_extra`) instead of proceedFlow.
    const [activeInputExtraKey, setActiveInputExtraKey] = useState<string | undefined>(undefined);
    // `signature|status` of the step whose form is currently open, and of the last step we
    // submitted. After a successful submit the backend may keep reporting that step in the same
    // status for a few polls; we suppress re-opening it until the target changes — a different
    // step, none, or the SAME step in a new status (e.g. a MANUAL_DYNAMIC_FORM step moving from
    // INPUT-REQUIRED to WAITING-SUBMISSION must re-open so completion polling starts).
    const activeInputSigRef = useRef<string | undefined>(undefined);
    const submittedInputSigRef = useRef<string | undefined>(undefined);

    // LAMF single-redirection "launch" popup (separate from the polling popup): a
    // one-button popup shown when the first on_select completes. It only opens the
    // form URL + saves the redirection URL, then disappears. It does NOT poll.
    const [launchPopUp, setLaunchPopUp] = useState(false);
    const [launchFormConfig, setLaunchFormConfig] = useState<FormFieldConfigType | undefined>(
        undefined
    );
    const launchHandledSigRef = useRef<string | undefined>(undefined);

    // User-initiated "extra trigger" popup — kept separate from the auto-open INPUT-REQUIRED popup.
    const [extraPopUp, setExtraPopUp] = useState(false);
    const [extraFormConfig, setExtraFormConfig] = useState<FormConfigType | undefined>(undefined);
    const [extraReferenceData, setExtraReferenceData] = useState<
        FlowMap["reference_data"] | undefined
    >(undefined);
    const [activeExtraKey, setActiveExtraKey] = useState<string | undefined>(undefined);
    const [triggeringKey, setTriggeringKey] = useState<string | undefined>(undefined);

    const {
        sessionId,
        sessionData,
        activeFlowId,
        autoScrollEnabled,
        acquireFlowFormDialogLock,
        releaseFlowFormDialogLock,
    } = useSession();

    const isAnyFormDialogOpen = inputPopUp || extraPopUp || launchPopUp;

    useEffect(() => {
        if (!isAnyFormDialogOpen) return;
        acquireFlowFormDialogLock?.();
        return () => releaseFlowFormDialogLock?.();
    }, [isAnyFormDialogOpen, acquireFlowFormDialogLock, releaseFlowFormDialogLock]);

    // const isLamfRedirectionFlow = flowId === LAMF_SINGLE_REDIRECTION_FLOW_ID;

    // Per-run key for the LAMF launch popup's "already handled" marker. Keyed on
    // the transaction id so it resets only when the flow is cleared (new txn id),
    // and persisted in localStorage so a page refresh does not re-show the popup.
    const launchMarkerKey = () => {
        const txnId = sessionData?.flowMap?.[flowId] ?? "";
        return `lamf_launch_done:${flowId}:${txnId}`;
    };

    // Mark the launch as done (button clicked) and dismiss the popup. The marker
    // persists across refreshes; it clears naturally when the flow is cleared.
    const handleFormLaunched = () => {
        try {
            localStorage.setItem(launchMarkerKey(), "1");
        } catch {
            // localStorage unavailable — non-fatal, popup just won't persist.
        }
        setLaunchPopUp(false);
        setLaunchFormConfig(undefined);
    };

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
    // know whether the tracking phase is active, to stop the flow engine auto-proceeding the ride
    // states — the seller drives on_status/on_update manually from the map. Tracking activates only
    // once the driver is assigned AND the initial location is shared (a track/on_track step is
    // COMPLETE) — NOT at on_confirm, so pre-assignment steps (e.g. the unsolicited on_update driver
    // assignment in "assign driver post on_confirm" flows) still auto-proceed normally.
    // IMPORTANT: this engine override must apply ONLY for the ride-map domain/version (TRV10 2.1.0).
    // For every other domain `trackingActive` stays false, so the normal auto-proceed behaviour of
    // track/on_track/on_status/on_update/status is fully preserved and their flows are unaffected.
    const trackingActive =
        isRideMapEnabled(sessionData?.domain, sessionData?.version) && isTrackingActive(mappedFlow);

    useEffect(() => {
        // LAMF single-redirection: as soon as the FIRST on_select completes (this
        // flow has a second on_select after on_status — that one must NOT trigger
        // it), show the separate one-button "launch" popup. Only the BPP session
        // shows it; it opens the form + saves the redirection URL, then disappears.
        // The polling popup is untouched and still opens via the normal selection.
        if (
            // isLamfRedirectionFlow &&
            sessionData?.npType === "BPP"
        ) {
            const firstOnSelect = mappedFlow?.sequence
                ?.filter((s) => s.actionType === "on_select")
                ?.sort((a, b) => a.index - b.index)?.[0];
            const formStep = mappedFlow?.sequence?.find((s) =>
                s.input?.some((f) => f.type === "MANUAL_DYNAMIC_FORM")
            );
            const manualFormField = formStep?.input?.find((f) => f.type === "MANUAL_DYNAMIC_FORM");

            // "Already handled" must survive a page refresh, so it is persisted in
            // localStorage keyed by the per-run transaction id; it resets only when
            // the flow is cleared, or once the form step itself is COMPLETE.
            const markerKey = launchMarkerKey();
            const alreadyDone = formStep?.status === "COMPLETE" || isLaunchDone(markerKey);

            if (firstOnSelect?.status === "COMPLETE" && manualFormField && !alreadyDone) {
                if (markerKey !== launchHandledSigRef.current) {
                    launchHandledSigRef.current = markerKey;
                    setLaunchFormConfig(manualFormField);
                    setLaunchPopUp(true);
                }
            } else if (firstOnSelect && firstOnSelect.status !== "COMPLETE") {
                // Flow was (re)started or hasn't reached the form point yet: re-arm
                // so the popup shows again on the next completion. The per-run
                // transaction id can be reused, so also clear the persisted marker.
                // During a live run on_select stays COMPLETE, so this never runs
                // mid-run — refresh-survival is preserved.
                launchHandledSigRef.current = undefined;
                try {
                    localStorage.removeItem(markerKey);
                } catch {
                    // localStorage unavailable — non-fatal.
                }
            }
        }

        // Sequence steps (skip first — that's the flow's initial trigger) take priority over extras.
        // MANUAL_DYNAMIC_FORM steps also auto-open on the counterparty side (WAITING-SUBMISSION):
        // both sessions poll the same completion callback, and each clears its own step.
        const seqStep = mappedFlow?.sequence?.filter(
            (s, index) =>
                (s.status === "INPUT-REQUIRED" ||
                    (s.status === "WAITING-SUBMISSION" &&
                        s.input?.some((f) => f.type === "MANUAL_DYNAMIC_FORM"))) &&
                index !== 0
        )?.[0];
        const extraStep = mappedFlow?.extraSteps?.find((s) => s.status === "INPUT-REQUIRED");
        const target = seqStep ?? extraStep;
        const conf = target?.input;
        // Ride Map (Part A): once the tracking phase is active (driver assigned + initial
        // track/on_track complete), it is fully manual — do NOT auto-open/auto-submit input for
        // track/on_track/on_status/etc. The seller advances these via the map controls.
        // (Pre-tracking steps like the on_update driver assignment and on_track_on_assign are not
        // suppressed — tracking only activates once they complete.)
        if (trackingActive && isTrackingPhaseStep(target?.actionType)) return;
        // Extra steps must be advanced via triggerExtra (carries `trigger_extra`); use the step's
        // actionId as the trigger key. Undefined => sequence step => proceedFlow.
        const extraKey = !seqStep && extraStep ? extraStep.actionId : undefined;

        const sig = target ? `${stepSignature(target)}|${target.status}` : undefined;
        // Same step in the same status we just submitted is still lagging on the backend —
        // don't re-open it. A status change on the same step is a genuinely new target.
        if (sig && sig === submittedInputSigRef.current) return;
        // User is filling a form — polling must not refresh config/reference data (remounts native selects).
        if (inputPopUp && sig && sig === activeInputSigRef.current) return;
        if (extraPopUp || launchPopUp) return;
        // Target moved on (different step or none) — drop the suppression and proceed.
        submittedInputSigRef.current = undefined;
        activeInputSigRef.current = sig;

        // LAMF single-redirection: both BAP and BPP auto-proceed past the
        // MANUAL_DYNAMIC_FORM step immediately (synthetic submission_id) instead of
        // opening the polling popup — neither side blocks on the form callback to
        // advance the flow. Scoped strictly to the MANUAL_DYNAMIC_FORM step, so no
        // other step/form is affected; the BPP launch popup is unchanged.
        if (
            // isLamfRedirectionFlow &&
            seqStep?.input?.some((f) => f.type === "MANUAL_DYNAMIC_FORM")
        ) {
            if (sessionData?.activeFlow !== flowId) return;
            submittedInputSigRef.current = sig; // proceed once per status (guards double-fire across polls)
            const submission_id = crypto.randomUUID();
            void handleFormSubmit({
                jsonPath: { submission_id },
                formData: { submission_id },
            });
            return;
        }

        if (conf?.length === 0) {
            if (sessionData?.activeFlow !== flowId) return;
            setActiveInputExtraKey(extraKey);
            handleFormSubmit({ jsonPath: {}, formData: {} }, extraKey);
            return;
        }
        setActiveInputExtraKey(extraKey);
        setActiveFormConfig(conf);
        setActiveFormTitle(target?.label);
        if (conf) {
            setActiveReferenceData(mappedFlow.reference_data);
            setInputPopUp(true);
        }
    }, [mappedFlow, inputPopUp, extraPopUp, launchPopUp]);

    useEffect(() => {
        const latestSending = mappedFlow?.sequence.find((f) => f.status === "RESPONDING");
        const transactionId = sessionData?.flowMap[flowId];
        // Ride Map (Part A): never auto-proceed tracking-phase steps once tracking is active
        // (driver assigned + initial track/on_track complete) — the seller drives them manually
        // via the map.
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
            setActiveFormTitle(undefined);
            setActiveReferenceData(undefined);
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
            setExtraReferenceData(mappedFlow.reference_data);
            setActiveExtraKey(extra.key);
            setExtraPopUp(true);
            return;
        }
        fireExtra(extra.key);
    };

    const closeExtraPopUp = () => {
        setExtraPopUp(false);
        setExtraFormConfig(undefined);
        setExtraReferenceData(undefined);
        setActiveExtraKey(undefined);
    };

    const handleExtraSubmit = async (formData: SubmitEventParams) => {
        if (!activeExtraKey) return;
        await fireExtra(activeExtraKey, formData.formData);
        closeExtraPopUp();
    };

    const handleFormSubmitRef = useRef(handleFormSubmit);
    handleFormSubmitRef.current = handleFormSubmit;

    const stableFormSubmit = useCallback(
        (formData: SubmitEventParams) => handleFormSubmitRef.current(formData),
        []
    );

    const handleExtraSubmitRef = useRef(handleExtraSubmit);
    handleExtraSubmitRef.current = handleExtraSubmit;

    const stableExtraSubmit = useCallback(
        (formData: SubmitEventParams) => handleExtraSubmitRef.current(formData),
        []
    );

    const inputFormContent = useMemo(() => {
        if (!activeFormConfig) return null;

        return (
            <FormConfig
                formConfig={activeFormConfig}
                submitEvent={stableFormSubmit}
                referenceData={activeReferenceData}
                flowId={flowId}
            />
        );
    }, [activeFormConfig, activeReferenceData, flowId, stableFormSubmit]);

    const extraFormContent = useMemo(() => {
        if (!extraFormConfig) return null;

        return (
            <FormConfig
                formConfig={extraFormConfig}
                submitEvent={stableExtraSubmit}
                referenceData={extraReferenceData}
                flowId={flowId}
            />
        );
    }, [extraFormConfig, extraReferenceData, flowId, stableExtraSubmit]);

    return (
        <>
            {eligibleExtras.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-5 bg-sky-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-brand-normal">Extra Triggers</h3>
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
                    <div key={stepSignature(pairedStep.first)} ref={registerRow(pairedStep)}>
                        <PairedCard pairedStep={pairedStep} flowId={flowId} />
                    </div>
                ))}
            </div>
            {extraSteps.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-alert-500">Extra Steps</h3>
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
                <FormFlowDialog open={inputPopUp} disableClose width="2xl" title={activeFormTitle}>
                    {inputFormContent}
                </FormFlowDialog>
            )}
            {launchPopUp && launchFormConfig && (
                <FormFlowDialog open={launchPopUp} disableClose width="md" title="Complete Form">
                    <FormLaunchPopup
                        formConfig={launchFormConfig}
                        referenceData={mappedFlow.reference_data}
                        transactionId={transactionId ?? ""}
                        onLaunched={handleFormLaunched}
                    />
                </FormFlowDialog>
            )}
            {extraPopUp && extraFormConfig && (
                <FormFlowDialog
                    open={extraPopUp}
                    width="xl"
                    onOpenChange={(open) => {
                        if (!open) {
                            closeExtraPopUp();
                        }
                    }}
                >
                    {extraFormContent}
                </FormFlowDialog>
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
        <TooltipHint content={tooltip}>
            <span className="inline-flex">
                <button
                    type="button"
                    disabled={disabled || loading}
                    onClick={onTrigger}
                    className="flex items-center gap-1.5 rounded-full border border-brand-light-active bg-brand-light px-3 py-1 text-sm font-semibold text-brand-normal transition-all duration-150 hover:bg-brand-light-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-default dark:bg-brand-dark/20 dark:hover:bg-brand-dark/30"
                >
                    {loading ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                    ) : (
                        <IoPlay className="text-sm" />
                    )}
                    <span>{label}</span>
                    {hasInput && (
                        <span className="rounded-full border border-brand-light-active bg-surface-elevated px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-normal dark:border-border-default dark:bg-surface-muted">
                            input
                        </span>
                    )}
                </button>
            </span>
        </TooltipHint>
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

// Whether the LAMF launch popup has already been handled this run (survives refresh).
function isLaunchDone(markerKey: string): boolean {
    try {
        return localStorage.getItem(markerKey) === "1";
    } catch {
        return false;
    }
}

// Nearest actually-scrolling ancestor, or null when the window/document is the scroller.
function getScrollParent(el: HTMLElement): HTMLElement | null {
    let parent = el.parentElement;
    while (parent) {
        const overflowY = getComputedStyle(parent).overflowY;
        if (
            (overflowY === "auto" || overflowY === "scroll") &&
            parent.scrollHeight > parent.clientHeight
        ) {
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
