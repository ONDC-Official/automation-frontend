import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MappedStep } from "@/types/flow-state-type";
import { useLazyGetCompletePayloadQuery } from "@store/api";
import {
    extractRequestError,
    findErroredSteps,
    type RequestError,
} from "@components/DomainFlowRunner/utils/step-error";
import type { StepErrorPopup } from "@components/DomainFlowRunner/StepErrorDialog";

/**
 * Shows a popup while any step of the flow has a request count of 2+ and its last request
 * carries an `error`. The popup is bound to the flow's live state, not stored: closing it hides
 * that error until the flow changes, a page reload shows it again, and once the flow is cleared
 * (counts reset) the next count of 2 shows a fresh popup.
 */
export function useStepErrorPopup({
    sequence,
    paused,
}: {
    sequence: MappedStep[] | undefined;
    /** Hold the popup back (e.g. while an input form is open); it shows once this turns false. */
    paused: boolean;
}) {
    const [triggerGetCompletePayload] = useLazyGetCompletePayloadQuery();
    /** Errors fetched for each last-request payload id (null = that request has no error). */
    const [errors, setErrors] = useState<Record<string, RequestError | null>>({});
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const inFlightRef = useRef<Set<string>>(new Set());

    const erroredSteps = useMemo(() => findErroredSteps(sequence), [sequence]);
    const activeIds = useMemo(
        () => erroredSteps.map((step) => step.lastPayloadId).join("|"),
        [erroredSteps]
    );

    // Forget errors and dismissals for steps that are no longer at 2+ (e.g. the flow was cleared).
    useEffect(() => {
        const active = new Set(activeIds ? activeIds.split("|") : []);
        setDismissed((prev) => {
            const next = new Set([...prev].filter((id) => active.has(id)));
            return next.size === prev.size ? prev : next;
        });
        setErrors((prev) => {
            const kept = Object.entries(prev).filter(([id]) => active.has(id));
            return kept.length === Object.keys(prev).length ? prev : Object.fromEntries(kept);
        });
    }, [activeIds]);

    // Load the last request of each newly errored step.
    useEffect(() => {
        for (const step of erroredSteps) {
            const id = step.lastPayloadId;
            if (id in errors || inFlightRef.current.has(id)) continue;
            inFlightRef.current.add(id);
            triggerGetCompletePayload({ payloadIds: [id] })
                .unwrap()
                .then((payloads) => {
                    const error = extractRequestError(payloads?.[0]?.req);
                    setErrors((prev) => ({ ...prev, [id]: error }));
                })
                .catch((e) => {
                    console.error("Failed to load request for step error popup", e);
                })
                .finally(() => {
                    inFlightRef.current.delete(id);
                });
        }
    }, [erroredSteps, errors, triggerGetCompletePayload]);

    const popup: StepErrorPopup | null = useMemo(() => {
        for (const step of erroredSteps) {
            const error = errors[step.lastPayloadId];
            if (error && !dismissed.has(step.lastPayloadId)) return { step, error };
        }
        return null;
    }, [erroredSteps, errors, dismissed]);

    const dismiss = useCallback(() => {
        if (!popup) return;
        const id = popup.step.lastPayloadId;
        setDismissed((prev) => new Set(prev).add(id));
    }, [popup]);

    return { popup: paused ? null : popup, dismiss };
}
