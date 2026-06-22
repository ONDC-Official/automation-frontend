interface IResizeDividerProps {
    onStartDragging: () => void;
    onNudge: (deltaPercent: number) => void;
}

const NUDGE_STEP_PERCENT = 2;

export const ResizeDivider = ({ onStartDragging, onNudge }: IResizeDividerProps) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            onNudge(-NUDGE_STEP_PERCENT);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            onNudge(NUDGE_STEP_PERCENT);
        }
    };

    return (
        <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            tabIndex={0}
            onMouseDown={onStartDragging}
            onKeyDown={handleKeyDown}
            className="group relative flex w-3 shrink-0 cursor-col-resize items-center justify-center self-stretch focus:outline-none"
        >
            <div className="h-full w-px bg-border-default transition-colors group-hover:bg-brand-normal group-focus:bg-brand-normal" />
            <div className="absolute h-12 w-1 rounded-full bg-border-default transition-colors group-hover:bg-brand-normal group-focus:bg-brand-normal" />
        </div>
    );
};
