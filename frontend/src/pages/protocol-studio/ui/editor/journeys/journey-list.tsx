import {
    CursorArrowRaysIcon,
    MapIcon,
    PlusIcon,
    SparklesIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import { OPEN_MODE_ID } from "@pages/protocol-studio/hooks/use-studio-journeys";
import type { WalkEnd } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type { StudioJourney } from "@pages/protocol-studio/ui/editor/types";

export interface JourneyStatus {
    /** Stops at an unresolved fork. */
    pending: boolean;
    /** Nodes on the path. */
    length: number;
    end: WalkEnd;
}

export interface IJourneysCardProps {
    isHidden: boolean;
    resizeHandleProps: React.HTMLAttributes<HTMLDivElement>;
    journeys: StudioJourney[];
    /** The journey shown, `OPEN_MODE_ID` for the interactive mode, or null. */
    selectedId: string | null;
    status: Map<string, JourneyStatus>;
    /** How many forks the protocol has: what the open mode will ask about. */
    forkCount: number;
    /** The protocol has nodes to extract journeys from. */
    canCreate: boolean;
    onSelect: (id: string | null) => void;
    onNew: () => void;
    onDerive: () => void;
    onRemove: (id: string) => void;
}

/**
 * The Journeys stage's left card: the interactive mode first (a run mode,
 * not a journey), then every journey extracted from the protocol, with a dot
 * saying whether its path is fully resolved.
 */
export const JourneysCard = ({
    isHidden,
    resizeHandleProps,
    journeys,
    selectedId,
    status,
    forkCount,
    canCreate,
    onSelect,
    onNew,
    onDerive,
    onRemove,
}: IJourneysCardProps) => (
    <section
        className="studio-glass studio-explorer flex flex-col"
        aria-label="Journeys"
        inert={isHidden}
    >
        <div
            className="studio-handle studio-handle-x-end"
            aria-label="Resize journeys"
            title="Drag to resize · double-click to reset"
            {...resizeHandleProps}
        />

        <div className="studio-explorer-head">
            <div className="min-w-0 flex-1">
                <p className="studio-eyebrow">Journeys</p>
                <p className="studio-text-dim truncate text-[12px]">
                    Mock runs extracted from the protocol
                </p>
            </div>
            <button
                type="button"
                className="studio-key studio-key-sm"
                onClick={onNew}
                disabled={!canCreate}
                title={
                    canCreate
                        ? "Start a journey at the protocol's entry"
                        : "Add nodes on the Protocol stage first"
                }
            >
                <PlusIcon />
                New
            </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
            <button
                type="button"
                className="studio-journey-row studio-journey-open"
                data-selected={selectedId === OPEN_MODE_ID || undefined}
                onClick={() => onSelect(OPEN_MODE_ID)}
            >
                <span className="studio-journey-icon">
                    <CursorArrowRaysIcon />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="studio-journey-title">Interactive · open mode</span>
                    <span className="studio-journey-sub">
                        Not a preset: the UI asks at each of {forkCount}{" "}
                        {forkCount === 1 ? "fork" : "forks"}; decisions decide themselves
                    </span>
                </span>
            </button>

            <div className="studio-explorer-toolbar mt-2">
                <span className="studio-eyebrow">Presets</span>
                <span className="studio-text-faint ml-auto text-[11px]">
                    {journeys.length} {journeys.length === 1 ? "journey" : "journeys"}
                </span>
            </div>

            {journeys.length === 0 ? (
                <div className="studio-explorer-empty py-6">
                    <MapIcon className="studio-explorer-empty-icon" />
                    <p className="studio-empty-hint-title">No journeys yet</p>
                    <p className="studio-empty-hint-sub">
                        A journey walks the protocol with every fork resolved — out of stock, a
                        cancellation, the happy path. Start one, or derive them all.
                    </p>
                </div>
            ) : (
                <ul className="studio-tree" aria-label="Journeys">
                    {journeys.map((journey) => {
                        const s = status.get(journey.id);
                        const isSelected = journey.id === selectedId;
                        return (
                            <li key={journey.id} className="bp-tree-item">
                                <button
                                    type="button"
                                    className="studio-journey-row"
                                    data-selected={isSelected || undefined}
                                    aria-current={isSelected || undefined}
                                    onClick={() => onSelect(journey.id)}
                                    title={journey.description || undefined}
                                >
                                    <span
                                        className="studio-journey-dot"
                                        data-state={s?.pending ? "pending" : "ready"}
                                        title={
                                            s?.pending
                                                ? "Stops at an unresolved fork"
                                                : "Every fork resolved"
                                        }
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="studio-journey-title">
                                            {journey.title || journey.id}
                                        </span>
                                        <span className="studio-journey-sub">
                                            {s
                                                ? `${s.length} ${s.length === 1 ? "step" : "steps"}`
                                                : ""}
                                            {journey.tags.length > 0
                                                ? ` · ${journey.tags.join(", ")}`
                                                : ""}
                                        </span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="studio-tree-remove bp-tree-remove"
                                    onClick={() => onRemove(journey.id)}
                                    aria-label={`Delete journey ${journey.title}`}
                                    title="Delete journey"
                                >
                                    <XMarkIcon />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <button
                type="button"
                className="studio-key studio-key-sm mt-3 w-full justify-center"
                onClick={onDerive}
                disabled={!canCreate}
                title="Walk every way through the protocol and propose a journey for each"
            >
                <SparklesIcon />
                Derive journeys…
            </button>
        </div>
    </section>
);

export default JourneysCard;
