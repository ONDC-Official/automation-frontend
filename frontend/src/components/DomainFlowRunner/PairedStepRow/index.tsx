import PairedCard from "@components/DomainFlowRunner/PairCard";
import type { PairedStep } from "@components/DomainFlowRunner/MappedFlowUtils";

interface PairedStepRowProps {
    pairedStep: PairedStep;
    flowId: string;
    /** Ref callback registering this row's DOM node under its step signatures (auto-scroll). */
    registerRow: (el: HTMLDivElement | null) => void;
}

/** A single flow row: the paired-step card wrapped in its scroll-registration container. */
export function PairedStepRow({ pairedStep, flowId, registerRow }: PairedStepRowProps) {
    return (
        <div ref={registerRow}>
            <PairedCard pairedStep={pairedStep} flowId={flowId} />
        </div>
    );
}
