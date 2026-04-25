import { useRef, useState } from "react";
import {
    FaArrowLeft,
    FaChevronDown,
    FaChevronRight,
    FaQuestionCircle,
    FaSearch,
    FaTimes,
} from "react-icons/fa";
import { FAQS, HELP_SECTIONS, type Faq } from "./playground-help-content";

// ─── FaqItem ─────────────────────────────────────────────────────────────────

const FaqItem = ({ faq, defaultOpen = false }: { faq: Faq; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors text-left"
            >
                <span>{faq.q}</span>
                {open ? (
                    <FaChevronDown size={12} className="shrink-0 text-gray-400" />
                ) : (
                    <FaChevronRight size={12} className="shrink-0 text-gray-400" />
                )}
            </button>
            {open && (
                <div className="px-4 pb-4 pt-1 text-sm text-gray-700 border-t border-gray-100 leading-relaxed">
                    {faq.a}
                </div>
            )}
        </div>
    );
};

// ─── Search results view ──────────────────────────────────────────────────────

const SearchResults = ({
    query,
    onNavigate,
}: {
    query: string;
    onNavigate: (id: string) => void;
}) => {
    const q = query.toLowerCase();

    const matchedSections = HELP_SECTIONS.filter(
        (s) =>
            s.title.toLowerCase().includes(q) ||
            (s.keywords ?? "").toLowerCase().includes(q),
    );

    const matchedFaqs = FAQS.filter((f) => f.q.toLowerCase().includes(q));

    const total = matchedSections.length + matchedFaqs.length;

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                <FaSearch size={20} />
                <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-xs text-gray-400">
                {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>

            {matchedSections.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                        Sections
                    </p>
                    <div className="space-y-1">
                        {matchedSections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => onNavigate(s.id)}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 transition-colors text-left"
                            >
                                <span className="font-medium">{s.title}</span>
                                <FaChevronRight size={11} className="shrink-0 text-gray-400" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {matchedFaqs.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                        FAQs
                    </p>
                    <div className="space-y-2">
                        {matchedFaqs.map((faq, i) => (
                            <FaqItem key={i} faq={faq} defaultOpen />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface PlaygroundHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PlaygroundHelpModal = ({ isOpen, onClose }: PlaygroundHelpModalProps) => {
    const [activeSection, setActiveSection] = useState(HELP_SECTIONS[0].id);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

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

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[88vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <FaQuestionCircle className="text-sky-500" size={20} />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Playground — How to Use
                            </h2>
                            <p className="text-xs text-gray-400">
                                Protocol flow editor & mock runner guide
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <nav className="w-52 shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
                        {/* Search */}
                        <div className="px-3 py-3 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-sky-400 focus-within:bg-white transition-colors">
                                <FaSearch size={11} className="text-gray-400 shrink-0" />
                                <input
                                    ref={searchRef}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search…"
                                    className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Nav links — hidden while searching */}
                        {!isSearching && (
                            <div className="flex-1 overflow-y-auto py-4">
                                <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                                    Sections
                                </p>
                                {HELP_SECTIONS.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-none ${
                                            activeSection === section.id
                                                ? "bg-sky-50 text-sky-700 font-semibold border-r-2 border-sky-500"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                                <div className="my-3 border-t border-gray-100" />
                                <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                                    FAQ
                                </p>
                                <button
                                    onClick={() => setActiveSection("faq")}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-none ${
                                        isFaq
                                            ? "bg-sky-50 text-sky-700 font-semibold border-r-2 border-sky-500"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    Frequently Asked
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        {isSearching ? (
                            <SearchResults query={searchQuery.trim()} onNavigate={handleNavigate} />
                        ) : isFaq ? (
                            <>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">
                                    Frequently Asked Questions
                                </h2>
                                <p className="text-sm text-gray-500 mb-5">
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
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    {currentSection.title}
                                </h2>
                                {currentSection.content}
                            </>
                        ) : null}

                        {/* Navigation footer — hidden while searching */}
                        {!isSearching && (
                            <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
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
                                                    onClick={() => setActiveSection(prev)}
                                                    className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                                                >
                                                    <FaArrowLeft size={10} /> {labelOf(prev)}
                                                </button>
                                            ) : (
                                                <span />
                                            )}
                                            {next && (
                                                <button
                                                    onClick={() => setActiveSection(next)}
                                                    className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                                                >
                                                    {labelOf(next)}{" "}
                                                    <FaChevronRight size={10} />
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
