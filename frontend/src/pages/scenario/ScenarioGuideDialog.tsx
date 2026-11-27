import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    CheckMarkIcon,
    IdeaBulbIcon,
    OndcNetworkLogo,
    PersonIcon,
    ShoppingBagIcon,
} from "@assets/svgs/how-it-works";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@components/Shadcn/Dialog";
import {
    GUIDE_ACTIONS,
    GUIDE_DOMAIN,
    GUIDE_INTRO,
    GUIDE_NETWORK,
    type IGuideFeature,
} from "@pages/scenario/howItWorksContent";

interface IScenarioGuideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SLIDE_LABELS = ["What Workbench is", "Your domain", "The ONDC network"];
/** How far a finger must move sideways (px) to count as a swipe. */
const SWIPE_DISTANCE = 50;

/** The small heading line above each slide's big blue title. */
const Eyebrow = ({ children, className }: { children: string; className?: string }) => (
    <p className={cn("text-body-1 text-text-primary sm:text-h6", className)}>{children}</p>
);

/** The big blue title on each slide. */
const BigTitle = ({ children, className }: { children: string; className?: string }) => (
    <h3
        className={cn(
            "text-[2rem] leading-tight font-bold text-brand-normal sm:text-[2.5rem] lg:text-5xl lg:leading-[1.15]",
            className
        )}
    >
        {children}
    </h3>
);

const FeatureCard = ({ feature }: { feature: IGuideFeature }) => {
    const Icon = feature.icon;
    return (
        <div className="relative z-10 flex items-start gap-3 rounded-xl border border-n-30 bg-n-0 p-4 dark:border-border-default dark:bg-surface-elevated">
            <span
                className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg",
                    feature.tileClassName
                )}
            >
                <Icon className="size-7" />
            </span>
            <span className="min-w-0 space-y-1">
                <span className="block text-body-2 font-semibold text-text-primary">
                    {feature.title}
                </span>
                <span className="block text-caption-1 text-text-secondary">
                    {feature.description}
                </span>
            </span>
        </div>
    );
};

/** The round ONDC Workbench badge in the middle of slide 1. */
const WorkbenchBadge = ({ className }: { className?: string }) => (
    <div
        className={cn(
            "relative z-10 flex size-40 shrink-0 flex-col items-center justify-center gap-1 rounded-full border border-brand-light-active bg-n-0 shadow-lg lg:size-44 dark:border-brand-normal/40 dark:bg-n-0",
            className
        )}
    >
        <OndcNetworkLogo className="h-auto w-28 lg:w-32" />
        <span className="text-h6 font-bold text-n-800 lg:text-[1.375rem]">Workbench</span>
    </div>
);

/**
 * Dashed lines from each feature card down (or up) into the badge, with a dot where
 * each line meets a card (slide 1, laptop width and up). They sit in the row between the
 * cards; the 100x100 drawing stretches with that row, so the lines always reach both.
 */
const CARD_CENTRES = [24.5, 75.5];
const FeatureConnectors = () => (
    <div className="pointer-events-none absolute inset-0 text-brand-normal" aria-hidden="true">
        <svg
            className="absolute inset-0 size-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            data-testid="feature-connectors"
        >
            {[
                "M24.5 0 V 40 Q 24.5 46 29 46 H 40",
                "M75.5 0 V 40 Q 75.5 46 71 46 H 60",
                "M24.5 100 V 60 Q 24.5 54 29 54 H 40",
                "M75.5 100 V 60 Q 75.5 54 71 54 H 60",
            ].map((d) => (
                <path
                    key={d}
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </svg>
        {CARD_CENTRES.flatMap((left) => [
            <span
                key={`top-${left}`}
                className="absolute top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-normal"
                style={{ left: `${left}%` }}
            />,
            <span
                key={`bottom-${left}`}
                className="absolute bottom-0 size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-normal"
                style={{ left: `${left}%` }}
            />,
        ])}
    </div>
);

const IntroSlide = () => {
    const [topLeft, topRight, bottomLeft, bottomRight] = GUIDE_INTRO.features;
    return (
        <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col gap-6 p-6 sm:p-8">
                <div className="space-y-4">
                    <div>
                        <Eyebrow>{GUIDE_INTRO.eyebrow}</Eyebrow>
                        <BigTitle className="max-w-[12ch]">{GUIDE_INTRO.title}</BigTitle>
                    </div>
                    <p className="text-body-2 text-text-secondary sm:text-body-1">
                        {GUIDE_INTRO.description}
                    </p>
                </div>
                <div className="mt-auto rounded-xl border border-brand-light-active bg-gradient-to-br from-brand-light to-n-0 p-4 dark:border-brand-normal/40 dark:from-brand-normal/15 dark:to-transparent">
                    <p className="flex items-center gap-2 text-body-1 text-brand-normal">
                        <IdeaBulbIcon className="size-5 shrink-0" />
                        {GUIDE_INTRO.tip.title}
                    </p>
                    <p className="mt-2 text-body-2 text-text-secondary">
                        {GUIDE_INTRO.tip.description}
                    </p>
                </div>
            </div>

            <div className="border-t border-n-30 bg-n-10 p-6 sm:p-8 lg:border-t-0 lg:border-l dark:border-border-default dark:bg-surface-muted">
                {/* Below laptop width: badge on top, cards in a list. */}
                <div className="flex flex-col items-center gap-4 lg:hidden">
                    <WorkbenchBadge />
                    <div className="grid w-full gap-3 sm:grid-cols-2">
                        {GUIDE_INTRO.features.map((feature) => (
                            <FeatureCard key={feature.title} feature={feature} />
                        ))}
                    </div>
                </div>
                {/* Laptop width and up: two cards above, two below, joined to the badge. */}
                <div
                    className="relative hidden h-full min-h-[440px] grid-cols-2 grid-rows-[auto_1fr_auto] gap-x-6 lg:grid"
                    data-testid="feature-diagram"
                >
                    <FeatureCard feature={topLeft} />
                    <FeatureCard feature={topRight} />
                    <div className="relative col-span-2 flex items-center justify-center py-8">
                        <FeatureConnectors />
                        <WorkbenchBadge />
                    </div>
                    <FeatureCard feature={bottomLeft} />
                    <FeatureCard feature={bottomRight} />
                </div>
            </div>
        </div>
    );
};

const RoleCard = ({
    tone,
    youAre,
    title,
    description,
}: {
    tone: "seller" | "buyer";
    youAre: string;
    title: string;
    description: string;
}) => {
    const Icon = tone === "seller" ? ShoppingBagIcon : PersonIcon;
    return (
        <div
            className={cn(
                "flex flex-1 items-center gap-4 rounded-2xl border p-5 sm:p-6",
                tone === "seller"
                    ? "border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-800/20"
                    : "border-brand-light-active bg-brand-light dark:border-brand-normal/40 dark:bg-brand-normal/10"
            )}
        >
            <span
                className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl bg-n-0 shadow-sm dark:bg-surface-elevated",
                    tone === "seller"
                        ? "text-success-800 dark:text-success-200"
                        : "text-brand-normal"
                )}
            >
                <Icon className="size-7" />
            </span>
            <span className="min-w-0 space-y-2">
                <span className="block text-body-2 uppercase tracking-wide text-text-secondary">
                    If you are a <span className="font-semibold text-text-primary">{youAre}</span>
                </span>
                <span
                    className={cn(
                        "block text-body-1 font-semibold sm:text-h6",
                        tone === "seller"
                            ? "text-success-800 dark:text-success-200"
                            : "text-brand-normal"
                    )}
                >
                    {title}
                </span>
                <span className="block text-body-2 text-text-primary sm:text-body-1">
                    {description}
                </span>
            </span>
        </div>
    );
};

const ActionTile = ({ action }: { action: (typeof GUIDE_ACTIONS)[number] }) => {
    const Icon = action.icon;
    return (
        <span className="flex items-center gap-2.5 rounded-lg border border-n-30 bg-n-0 px-3 py-2.5 text-body-2 text-text-secondary dark:border-border-default dark:bg-surface-elevated">
            <Icon className="size-5 shrink-0" />
            {action.label}
        </span>
    );
};

const DomainSlide = () => (
    <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="space-y-4">
                <div>
                    <Eyebrow>{GUIDE_DOMAIN.eyebrow}</Eyebrow>
                    <BigTitle className="max-w-[10ch]">{GUIDE_DOMAIN.title}</BigTitle>
                </div>
                <p className="text-body-2 text-text-secondary sm:text-body-1">
                    {GUIDE_DOMAIN.description}
                </p>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3 sm:grid-cols-3">
                {GUIDE_ACTIONS.map((action) => (
                    <ActionTile key={action.label} action={action} />
                ))}
            </div>
        </div>
        <div className="flex flex-col gap-5 border-t border-n-30 bg-n-10 p-6 sm:p-8 lg:border-t-0 lg:border-l dark:border-border-default dark:bg-surface-muted">
            <RoleCard tone="seller" {...GUIDE_DOMAIN.roles.seller} />
            <RoleCard tone="buyer" {...GUIDE_DOMAIN.roles.buyer} />
        </div>
    </div>
);

const NetworkSlide = () => (
    <div className="flex h-full flex-col items-center gap-8 p-6 text-center sm:p-8">
        <div className="max-w-2xl space-y-3">
            <p className="text-body-2 uppercase tracking-wide text-text-secondary">
                {GUIDE_NETWORK.eyebrow}
            </p>
            <BigTitle>{GUIDE_NETWORK.title}</BigTitle>
            <p className="text-body-2 text-text-secondary sm:text-body-1">
                {GUIDE_NETWORK.description}
            </p>
        </div>
        <div className="grid w-full max-w-4xl items-center gap-6 text-left md:grid-cols-[minmax(0,15rem)_2.5rem_minmax(0,1fr)] md:gap-0">
            <ul className="space-y-3" aria-label="APIs checked">
                {GUIDE_NETWORK.checkedActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <li
                            key={action.label}
                            className="flex items-center gap-3 rounded-lg border border-n-30 bg-n-0 px-3 py-2.5 dark:border-border-default dark:bg-surface-elevated"
                        >
                            <Icon className="size-6 shrink-0 text-text-primary" />
                            <span className="flex-1 text-body-2 font-medium text-text-primary">
                                {action.label}
                            </span>
                            <span
                                className="flex size-6 items-center justify-center rounded bg-success-800 text-n-0"
                                title="Checked"
                            >
                                <CheckMarkIcon className="size-3.5" />
                                <span className="sr-only">checked</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
            {/* Dashed lines from the API list into the sample request (wide screens). */}
            <svg
                className="hidden h-full w-full text-brand-normal md:block"
                viewBox="0 0 40 100"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <path
                    d="M0 10 H 18 V 90 H 0 M0 30 H 18 M0 50 H 18 M0 70 H 18 M18 30 H 40 M18 50 H 40 M18 70 H 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div
                className="overflow-x-auto rounded-xl border border-brand-light-active bg-brand-light/50 dark:border-brand-normal/40 dark:bg-surface-muted"
                aria-label="Sample search request"
                role="figure"
            >
                <pre className="flex min-w-max py-4 font-mono text-[0.8125rem] leading-6">
                    <span
                        className="select-none border-r border-n-30 pr-3 pl-4 text-right text-text-secondary dark:border-border-default"
                        aria-hidden="true"
                    >
                        {GUIDE_NETWORK.sampleRequest.map((_, i) => (
                            <span key={i} className="block">
                                {i + 1}
                            </span>
                        ))}
                    </span>
                    <code className="pr-4 pl-4 text-text-primary">
                        {GUIDE_NETWORK.sampleRequest.map((line, i) => (
                            <span key={i} className="block whitespace-pre">
                                {line.map((token, j) => (
                                    <span
                                        key={j}
                                        className={cn(
                                            token.kind === "key" &&
                                                "text-error-500 dark:text-red-300",
                                            token.kind === "value" &&
                                                "text-brand-normal dark:text-sky-300"
                                        )}
                                    >
                                        {token.text}
                                    </span>
                                ))}
                            </span>
                        ))}
                    </code>
                </pre>
            </div>
        </div>
    </div>
);

const SLIDES = [IntroSlide, DomainSlide, NetworkSlide];

/**
 * "How it works": a 3-slide guide to Scenario Testing in a pop-up. Move with the
 * arrows, the dots, the keyboard's left/right keys, or a swipe on touch screens.
 */
export const ScenarioGuideDialog = ({ open, onOpenChange }: IScenarioGuideDialogProps) => {
    const [index, setIndex] = useState(0);
    const swipeStartX = useRef<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const last = SLIDES.length - 1;
    const goTo = (next: number) => setIndex(Math.min(last, Math.max(0, next)));

    // Always start from the first slide when the guide is opened again.
    useEffect(() => {
        if (open) setIndex(0);
    }, [open]);

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "ArrowRight") goTo(index + 1);
        if (event.key === "ArrowLeft") goTo(index - 1);
    };
    const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") swipeStartX.current = event.clientX;
    };
    const onPointerUp = (event: PointerEvent) => {
        if (swipeStartX.current === null) return;
        const moved = event.clientX - swipeStartX.current;
        swipeStartX.current = null;
        if (moved <= -SWIPE_DISTANCE) goTo(index + 1);
        if (moved >= SWIPE_DISTANCE) goTo(index - 1);
    };

    const arrowClass =
        "flex size-12 shrink-0 items-center justify-center rounded-full border border-n-0/40 bg-brand-normal text-n-0 shadow-lg transition-opacity hover:bg-brand-normal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-0 disabled:pointer-events-none disabled:opacity-40";
    const prevButton = (className?: string) => (
        <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
            className={cn(arrowClass, className)}
        >
            <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
    );
    const nextButton = (className?: string) => (
        <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === last}
            aria-label="Next slide"
            className={cn(arrowClass, className)}
        >
            <ChevronRight className="size-6" aria-hidden="true" />
        </button>
    );
    const dots = (className?: string) => (
        <div className={cn("flex items-center gap-2", className)}>
            {SLIDES.map((_, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}: ${SLIDE_LABELS[i]}`}
                    aria-current={i === index ? "step" : undefined}
                    className={cn(
                        "h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/60",
                        i === index
                            ? "w-8 bg-brand-normal"
                            : "w-5 bg-n-40 hover:bg-n-60 dark:bg-n-300"
                    )}
                />
            ))}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                ref={contentRef}
                onKeyDown={onKeyDown}
                // Focus the pop-up itself (not the first dot), so the arrow keys work at once.
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    contentRef.current?.focus();
                }}
                className="flex max-h-[calc(100dvh-2rem)] outline-none w-[calc(100%-2rem)] max-w-[1142px] flex-col gap-0 overflow-visible p-0 sm:max-w-[1142px] min-[1320px]:max-h-[calc(100dvh-7rem)]"
            >
                <div className="flex shrink-0 items-center gap-3 border-b border-n-30 px-6 py-4 pr-14 dark:border-border-default">
                    <DialogTitle className="text-body-1 font-semibold">How it works</DialogTitle>
                    <DialogDescription className="text-body-2 text-text-secondary">
                        {index + 1} of {SLIDES.length}
                    </DialogDescription>
                </div>

                <div
                    className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto min-[1320px]:rounded-b-2xl"
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="How Scenario Testing works"
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => (swipeStartX.current = null)}
                    style={{ touchAction: "pan-y" }}
                >
                    <div
                        className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
                        style={{ transform: `translateX(-${index * 100}%)` }}
                    >
                        {SLIDES.map((Slide, i) => (
                            <section
                                key={SLIDE_LABELS[i]}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${i + 1} of ${SLIDES.length}: ${SLIDE_LABELS[i]}`}
                                aria-hidden={i !== index}
                                inert={i !== index}
                                className={cn(
                                    "w-full shrink-0 transition-opacity duration-300",
                                    i !== index && "opacity-0"
                                )}
                            >
                                <Slide />
                            </section>
                        ))}
                    </div>
                </div>

                {/* Small and medium screens: controls inside the pop-up. */}
                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-n-30 px-6 py-3 min-[1320px]:hidden dark:border-border-default">
                    {prevButton("size-10")}
                    {dots()}
                    {nextButton("size-10")}
                </div>

                {/* Wide screens: arrows beside the pop-up and dots below it, like the design. */}
                {prevButton("absolute top-1/2 -left-20 hidden -translate-y-1/2 min-[1320px]:flex")}
                {nextButton("absolute top-1/2 -right-20 hidden -translate-y-1/2 min-[1320px]:flex")}
                {dots("absolute -bottom-10 left-1/2 hidden -translate-x-1/2 min-[1320px]:flex")}
            </DialogContent>
        </Dialog>
    );
};
