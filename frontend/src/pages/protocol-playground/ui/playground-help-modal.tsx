import { useRef, useState } from "react";
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import { Input } from "@/components/Shadcn/TextField/input";
import { cn } from "@/lib/utils";
import { FAQS, HELP_SECTIONS, type Faq } from "./playground-help-content";

const FaqItem = ({ faq, defaultOpen = false }: { faq: Faq; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="overflow-hidden rounded-lg border border-border-default">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
            >
                <span>{faq.q}</span>
                {open ? (
                    <ChevronDownIcon className="size-3 shrink-0 text-text-secondary" />
                ) : (
                    <ChevronRightIcon className="size-3 shrink-0 text-text-secondary" />
                )}
            </button>
            {open ? (
                <div className="border-t border-border-default px-4 pt-1 pb-4 text-sm leading-relaxed text-text-secondary">
                    {faq.a}
                </div>
            ) : null}
        </div>
    );
};

const SearchResults = ({
    query,
    onNavigate,
}: {
    query: string;
    onNavigate: (id: string) => void;
}) => {
    const q = query.toLowerCase();

    const matchedSections = HELP_SECTIONS.filter(
        (s) => s.title.toLowerCase().includes(q) || (s.keywords ?? "").toLowerCase().includes(q)
    );

    const matchedFaqs = FAQS.filter((f) => f.q.toLowerCase().includes(q));
    const total = matchedSections.length + matchedFaqs.length;

    if (total === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-text-secondary">
                <MagnifyingGlassIcon className="size-5" />
                <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-xs text-text-secondary">
                {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>

            {matchedSections.length > 0 ? (
                <div>
                    <p className="mb-2 text-[10px] font-semibold tracking-widest text-text-secondary uppercase">
                        Sections
                    </p>
                    <div className="space-y-1">
                        {matchedSections.map((s) => (
                            <button
                                type="button"
                                key={s.id}
                                onClick={() => onNavigate(s.id)}
                                className="flex w-full items-center justify-between rounded-lg border border-border-default px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:border-brand-light-active hover:bg-brand-light dark:hover:bg-surface-muted"
                            >
                                <span className="font-medium">{s.title}</span>
                                <ChevronRightIcon className="size-3 shrink-0 text-text-secondary" />
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            {matchedFaqs.length > 0 ? (
                <div>
                    <p className="mb-2 text-[10px] font-semibold tracking-widest text-text-secondary uppercase">
                        FAQs
                    </p>
                    <div className="space-y-2">
                        {matchedFaqs.map((faq, i) => (
                            <FaqItem key={i} faq={faq} defaultOpen />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

interface IPlaygroundHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PlaygroundHelpModal = ({ isOpen, onClose }: IPlaygroundHelpModalProps) => {
    const [activeSection, setActiveSection] = useState(HELP_SECTIONS[0].id);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    const isSearching = searchQuery.trim().length > 0;
    const isFaq = !isSearching && activeSection === "faq";
    const currentSection =
        !isSearching && !isFaq
            ? (HELP_SECTIONS.find((s) => s.id === activeSection) ?? HELP_SECTIONS[0])
            : null;

    const handleNavigate = (id: string) => {
        setSearchQuery("");
        setActiveSection(id);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSearchQuery("");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="flex h-[88vh] max-w-5xl flex-col gap-0 overflow-hidden p-0"
            >
                <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-border-default px-6 py-4">
                    <div className="flex items-center gap-3">
                        <QuestionMarkCircleIcon className="size-5 text-brand-normal" />
                        <div>
                            <DialogTitle className="text-lg">Playground — How to Use</DialogTitle>
                            <DialogDescription>
                                Protocol flow editor & mock runner guide
                            </DialogDescription>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </DialogHeader>

                <div className="flex min-h-0 flex-1">
                    <nav className="flex w-52 shrink-0 flex-col overflow-hidden border-r border-border-default">
                        <div className="shrink-0 border-b border-border-default px-3 py-3">
                            <div className="relative">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-secondary" />
                                <Input
                                    ref={searchRef}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search…"
                                    className="h-8 pl-8 text-xs"
                                />
                                {searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                    >
                                        <XMarkIcon className="size-3" />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {!isSearching ? (
                            <div className="flex-1 overflow-y-auto py-4">
                                <p className="mb-2 px-4 text-[10px] font-semibold tracking-widest text-text-secondary uppercase">
                                    Sections
                                </p>
                                {HELP_SECTIONS.map((section) => (
                                    <button
                                        type="button"
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={cn(
                                            "w-full rounded-none px-4 py-2 text-left text-sm transition-colors",
                                            activeSection === section.id
                                                ? "border-r-2 border-brand-normal bg-brand-light font-semibold text-brand-normal dark:bg-surface-muted"
                                                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                                        )}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                                <div className="my-3 border-t border-border-default" />
                                <p className="mb-2 px-4 text-[10px] font-semibold tracking-widest text-text-secondary uppercase">
                                    FAQ
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection("faq")}
                                    className={cn(
                                        "w-full rounded-none px-4 py-2 text-left text-sm transition-colors",
                                        isFaq
                                            ? "border-r-2 border-brand-normal bg-brand-light font-semibold text-brand-normal dark:bg-surface-muted"
                                            : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                                    )}
                                >
                                    Frequently Asked
                                </button>
                            </div>
                        ) : null}
                    </nav>

                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        {isSearching ? (
                            <SearchResults query={searchQuery.trim()} onNavigate={handleNavigate} />
                        ) : isFaq ? (
                            <>
                                <h2 className="mb-1 text-xl font-bold text-text-primary">
                                    Frequently Asked Questions
                                </h2>
                                <p className="mb-5 text-sm text-text-secondary">
                                    Common questions about using the playground.
                                </p>
                                <div className="space-y-2">
                                    {FAQS.map((faq, i) => (
                                        <FaqItem key={i} faq={faq} />
                                    ))}
                                </div>
                            </>
                        ) : currentSection ? (
                            <>
                                <h2 className="mb-4 text-xl font-bold text-text-primary">
                                    {currentSection.title}
                                </h2>
                                {currentSection.content}
                            </>
                        ) : null}

                        {!isSearching ? (
                            <div className="mt-10 flex justify-between border-t border-border-default pt-4 text-xs text-text-secondary">
                                {(() => {
                                    const allIds = [...HELP_SECTIONS.map((s) => s.id), "faq"];
                                    const idx = allIds.indexOf(activeSection);
                                    const prev = idx > 0 ? allIds[idx - 1] : null;
                                    const next = idx < allIds.length - 1 ? allIds[idx + 1] : null;
                                    const labelOf = (id: string) =>
                                        HELP_SECTIONS.find((s) => s.id === id)?.title ??
                                        "Frequently Asked";

                                    return (
                                        <>
                                            {prev ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveSection(prev)}
                                                    className="flex items-center gap-1 transition-colors hover:text-brand-normal"
                                                >
                                                    <ArrowLeftIcon className="size-3" />{" "}
                                                    {labelOf(prev)}
                                                </button>
                                            ) : (
                                                <span />
                                            )}
                                            {next ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveSection(next)}
                                                    className="flex items-center gap-1 transition-colors hover:text-brand-normal"
                                                >
                                                    {labelOf(next)}{" "}
                                                    <ChevronRightIcon className="size-3" />
                                                </button>
                                            ) : null}
                                        </>
                                    );
                                })()}
                            </div>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
