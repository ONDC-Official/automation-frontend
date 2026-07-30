import { FC, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpenIcon,
    ChevronRightIcon,
    CodeBracketIcon,
    DocumentTextIcon,
    KeyIcon,
    MagnifyingGlassIcon,
    Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import { ROUTES, getDeveloperGuideDocPath, getDeveloperGuideUseCasePath } from "@constants/routes";
import { buildGeneralDocCommentScope } from "@/types/comment-scope";
import {
    GETTING_STARTED_SECTIONS,
    HOW_TO_GUIDES,
    findReferenceUseCase,
} from "../landing/getting-started-sections";
import { useDeveloperGuideShell } from "./DeveloperGuideNav";
import DeveloperGuideGuideCard from "./DeveloperGuideGuideCard";
import CommentsPanel from "../flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "../DocsViewer/useDocsSectionSelection";
import { useInlineCommentHeading } from "../shared/hooks/useInlineCommentHeading";
import { getDomainDisplayLabel } from "../domainGrouping";

const GETTING_STARTED_SLUG = "getting-started";

/** Synthetic markdown so section hashes/labels stay in sync with `GETTING_STARTED_SECTIONS`. */
const GETTING_STARTED_SECTION_MARKDOWN = GETTING_STARTED_SECTIONS.map(
    (section) => `## ${section.label}`
).join("\n\n");

interface PathCard {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}

interface ResourceLink {
    id: string;
    title: string;
    description: string;
    onClick?: () => void;
}

const SectionHeading: FC<{
    sectionId: string;
    label: string;
    onSelect: (id: string) => void;
    headingAction?: ReactNode;
    className?: string;
}> = ({ sectionId, label, onSelect, headingAction, className }) => (
    <h2
        className={cn(
            "group/heading mb-2 flex scroll-mt-24 items-center gap-2 text-xl font-semibold text-brand-normal",
            className
        )}
    >
        <button
            type="button"
            onClick={() => onSelect(sectionId)}
            className="min-w-0 cursor-default text-left text-inherit"
        >
            {label}
        </button>
        {headingAction ? (
            <span
                className="shrink-0 scale-95 opacity-0 transition-all duration-150 group-hover/heading:scale-100 group-hover/heading:opacity-100 group-focus-within/heading:scale-100 group-focus-within/heading:opacity-100 focus-within:scale-100 focus-within:opacity-100 has-data-[state=open]:scale-100 has-data-[state=open]:opacity-100"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                {headingAction}
            </span>
        ) : null}
    </h2>
);

const DeveloperGuideGettingStartedContent: FC = () => {
    const navigate = useNavigate();
    const { builds } = useDeveloperGuideShell();

    const docSlugs = useMemo(() => [GETTING_STARTED_SLUG], []);
    const docsRecord = useMemo(
        () => ({ [GETTING_STARTED_SLUG]: GETTING_STARTED_SECTION_MARKDOWN }),
        []
    );
    const {
        selectedSectionId,
        selectedSectionLabel,
        selectSection,
        rightPanelOpen,
        setRightPanelOpen,
        toc,
        tocOffset,
    } = useDocsSectionSelection({ docSlugs, docs: docsRecord });

    const commentScope = useMemo(() => buildGeneralDocCommentScope(GETTING_STARTED_SLUG), []);
    const { renderHeadingAction, commentsRefreshKey } = useInlineCommentHeading({
        commentScope,
        selectSection,
        setRightPanelOpen,
    });

    const resolveSectionLabel = useCallback(
        (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
        [toc]
    );

    const referenceUseCase = useMemo(() => findReferenceUseCase(builds), [builds]);

    const openReferenceUseCase = () => {
        if (!referenceUseCase) {
            navigate(ROUTES.DEVELOPER_GUIDE_DOMAINS);
            return;
        }
        navigate(
            getDeveloperGuideUseCasePath(
                referenceUseCase.domainKey,
                referenceUseCase.versionKey,
                referenceUseCase.label
            )
        );
    };

    const referencePathHint = referenceUseCase
        ? `For eg. API Reference by Domain → Financial Services → ${getDomainDisplayLabel(referenceUseCase.domainKey)} → ${referenceUseCase.label}`
        : "API Reference by Domain → Financial Services → Credit (FIS12) → LAMF";

    const commonPaths: PathCard[] = [
        {
            id: "browse-domains",
            title: "Browse by domain",
            subtitle: "API reference",
            description:
                "Explore protocol specs and use-case flows grouped by domain family — Retail, Logistics, Financial Services, and more.",
            icon: <CodeBracketIcon className="size-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(ROUTES.DEVELOPER_GUIDE_DOMAINS),
        },
        {
            id: "auth-tools",
            title: "Auth Tools",
            subtitle: "Authorization",
            description:
                "Generate and verify ONDC authorization headers using BLAKE2B-512 hashing and Ed25519 signing.",
            icon: <KeyIcon className="size-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(ROUTES.DEVELOPER_GUIDE_AUTH_TOOLS),
        },
        {
            id: "schema-validation",
            title: "Schema Validation",
            subtitle: "Payloads",
            description:
                "Validate sample request and response payloads against domain schemas before you integrate.",
            icon: <DocumentTextIcon className="size-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(ROUTES.SCHEMA),
        },
    ];

    const exploreSteps: ResourceLink[] = [
        {
            id: "product-understanding",
            title: "Read Documents",
            description: "Get domain and use-case context before you dig into protocol calls.",
        },
        {
            id: "browse-flows",
            title: "Browse Flows",
            description: "Select a flow, then an action, to walk the sequence of protocol calls.",
        },
        {
            id: "inspect-payloads",
            title: "Inspect payloads and schemas",
            description:
                "Review example payloads, request/response schemas, validations, and key attributes.",
        },
        {
            id: "capture-notes",
            title: "Capture notes as you go",
            description:
                "Record edge cases, error handling, and partner-specific behavior while reviewing examples.",
        },
    ];

    const moreResources: ResourceLink[] = [
        {
            id: "general-docs",
            title: "General documentation",
            description: "Core concepts, network fundamentals, and shared reference guides.",
            onClick: () => navigate(ROUTES.DEVELOPER_GUIDE_GENERAL),
        },
        {
            id: "all-domains",
            title: "Explore all domains",
            description: "Don’t see your use case yet? Browse the full API reference by domain.",
            onClick: () => navigate(ROUTES.DEVELOPER_GUIDE_DOMAINS),
        },
    ];

    return (
        <div className="min-h-full bg-white dark:bg-surface-page">
            <div className="shrink-0 flex gap-2 mx-4 mt-4 px-4 py-2 bg-alert-50 items-center border-b border-alert-50">
                <MagnifyingGlassIcon className="size-3.5 text-alert-500 shrink-0" aria-hidden />
                <span className="text-alert-500 text-[12px] font-semibold">Tip: </span>
                <span className="text-[12px] font-regular text-n-300">
                    Use Search in the sidebar to quickly find a domain, use case, or documentation
                    page.
                </span>
            </div>

            <header className=" border-n-40 bg-white dark:border-n-60 dark:bg-surface-elevated">
                <div className="p-4 max-w-full">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-n-40 bg-brand-light px-3 py-1.5 text-caption-2-size font-semibold uppercase tracking-widest text-brand-normal dark:border-n-60 dark:bg-brand-normal/10">
                        <BookOpenIcon className="size-2.75" aria-hidden />
                        Getting started
                    </div>
                    <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-n-900 dark:text-n-0 md:text-4xl">
                        Get <span className="text-brand-normal">started</span>
                    </h1>
                    <p className="max-w-6xl text-body-1 text-n-300 dark:text-n-60">
                        Learn how to explore ONDC protocol flows in the Developer Guide — starting
                        with a reference use case, then moving into payloads, schemas, and tools.
                    </p>
                    <h2 className="mt-6 mb-2 text-xl font-semibold text-brand-normal">
                        Learn about ONDC
                    </h2>
                    <p className="max-w-6xl text-body-1 text-n-300 dark:text-n-60">
                        ONDC is an open, interoperable network for digital commerce — it lets buyer
                        and seller apps discover, transact, and fulfill across platforms through a
                        shared protocol, without locking either side into a single app.
                    </p>
                    <Button
                        type="button"
                        className="mt-4"
                        onClick={() => navigate(getDeveloperGuideDocPath("about-ondc"))}
                    >
                        Know more
                    </Button>
                    <p className="mt-4 max-w-6xl text-body-1 text-n-300 dark:text-n-60">
                        To start with ONDC, the sections below will guide you through how a
                        developer finds the information they need — and walk you through how things
                        work, step by step.
                    </p>
                </div>
            </header>

            <div className="flex items-stretch p-4 min-h-[60vh]">
                <div className="relative min-w-0 flex-1 space-y-10">
                    <section
                        id={GETTING_STARTED_SECTIONS[0].id}
                        className="scroll-mt-24 rounded-2xl border border-n-40 bg-white p-6 dark:border-n-60 dark:bg-surface-elevated"
                    >
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-n-40 bg-brand-light dark:border-n-60 dark:bg-brand-normal/10">
                                    <Square3Stack3DIcon
                                        className="size-5 text-brand-normal"
                                        aria-hidden
                                    />
                                </div>
                                <SectionHeading
                                    sectionId={GETTING_STARTED_SECTIONS[0].id}
                                    label={GETTING_STARTED_SECTIONS[0].label}
                                    onSelect={selectSection}
                                    headingAction={renderHeadingAction(
                                        GETTING_STARTED_SECTIONS[0].id
                                    )}
                                />
                                <p className="mb-2 text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                    Open any usecase as your reference use case from the sidebar
                                    under{" "}
                                    <strong className="font-semibold text-n-900 dark:text-n-0">
                                        API Reference by Domain selection
                                    </strong>
                                    .
                                </p>
                                <p className="mb-3 text-caption-1 text-n-300 dark:text-n-60">
                                    <strong className="font-semibold text-n-900 dark:text-n-0">
                                        {referencePathHint}
                                    </strong>
                                </p>
                                <p className="text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                    To understand it completely after the usecase, walk through the
                                    sections of Documents, Flows, and Error Codes. The same way, you
                                    can explore for every other domain. Please check the API
                                    Reference by Domain section from sidebar to get the list of all
                                    the usecases.
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-5 self-start">
                                <Button type="button" onClick={openReferenceUseCase}>
                                    Open Usecase
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                                    title={
                                        rightPanelOpen
                                            ? "Collapse comments panel"
                                            : "Expand comments panel"
                                    }
                                    aria-label={
                                        rightPanelOpen
                                            ? "Collapse comments panel"
                                            : "Expand comments panel"
                                    }
                                    className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 dark:border-border-default dark:bg-surface-elevated dark:hover:bg-surface-muted"
                                >
                                    <ChevronRightIcon
                                        className={cn(
                                            "size-3 text-slate-400 transition-transform duration-300 ease-in-out",
                                            rightPanelOpen ? "" : "rotate-180"
                                        )}
                                    />
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[1].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[1].id}
                            label={GETTING_STARTED_SECTIONS[1].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[1].id)}
                        />
                        <p className="mb-5 max-w-2xl text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Jump to the path that matches what you need right now.
                        </p>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6">
                            {commonPaths.map((card) => (
                                <DeveloperGuideGuideCard
                                    key={card.id}
                                    title={card.title}
                                    subtitle={card.subtitle}
                                    description={card.description}
                                    icon={card.icon}
                                    onClick={card.onClick}
                                />
                            ))}
                        </div>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[2].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[2].id}
                            label={GETTING_STARTED_SECTIONS[2].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[2].id)}
                        />
                        <p className="mb-5 max-w-2xl text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Once a use case is open, work through it in this order.
                        </p>
                        <ul className="divide-y divide-n-40 rounded-2xl border border-n-40 dark:divide-n-60 dark:border-n-60">
                            {exploreSteps.map((step) => (
                                <li key={step.id} className="px-5 py-4">
                                    <p className="mb-1 text-base font-semibold text-n-900 dark:text-n-0">
                                        {step.title}
                                    </p>
                                    <p className="mb-0 text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                        {step.description}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[3].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[3].id}
                            label={GETTING_STARTED_SECTIONS[3].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[3].id)}
                        />
                        <p className="mb-5 max-w-2xl text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Keep going with shared docs and the full domain catalog.
                        </p>
                        <ul className="divide-y divide-n-40 rounded-2xl border border-n-40 dark:divide-n-60 dark:border-n-60">
                            {moreResources.map((item) => (
                                <li key={item.id}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={item.onClick}
                                        className="h-auto w-full flex-col items-start justify-start whitespace-normal rounded-none px-5 py-4 text-left font-normal hover:bg-brand-light/60 dark:hover:bg-brand-normal/10"
                                    >
                                        <span className="mb-1 text-base font-semibold text-brand-normal">
                                            {item.title}
                                        </span>
                                        <span className="text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                            {item.description}
                                        </span>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[4].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[4].id}
                            label={GETTING_STARTED_SECTIONS[4].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[4].id)}
                        />
                        <p className="mb-5 max-w-2xl text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Short walkthroughs of how different screens and flows work in the
                            Workbench.
                        </p>
                        <div className="space-y-6">
                            {HOW_TO_GUIDES.map((guide) => (
                                <div
                                    key={guide.id}
                                    className="overflow-hidden rounded-2xl border border-n-40 dark:border-n-60"
                                >
                                    <div className="border-b border-n-40 px-5 py-4 dark:border-n-60">
                                        <p className="mb-1 text-base font-semibold text-n-900 dark:text-n-0">
                                            {guide.title}
                                        </p>
                                        <p className="mb-0 text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                            {guide.description}
                                        </p>
                                    </div>
                                    <div className="aspect-video bg-n-20 dark:bg-surface-muted">
                                        <iframe
                                            title={`${guide.title} walkthrough`}
                                            src={`https://drive.google.com/file/d/${guide.driveFileId}/preview`}
                                            className="size-full border-0"
                                            allow="autoplay"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div
                    className={cn(
                        "shrink-0 self-start sticky overflow-hidden transition-[max-width,margin-left,opacity] duration-300 ease-in-out",
                        rightPanelOpen
                            ? "max-w-80 ml-6 opacity-100"
                            : "max-w-0 ml-0 opacity-0 pointer-events-none"
                    )}
                    style={{ top: tocOffset, height: `calc(100vh - ${tocOffset}px)` }}
                >
                    <div className="h-full w-80">
                        <CommentsPanel
                            key={commentsRefreshKey}
                            selectedPath={selectedSectionId}
                            commentScope={commentScope}
                            selectionLabel={selectedSectionLabel}
                            resolvePathLabel={resolveSectionLabel}
                            emptySelectionMessage="Select a section to add comments."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperGuideGettingStartedContent;
