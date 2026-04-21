import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { ROUTES } from "@constants/routes";
import { fetchDocContent } from "@services/developerDocsApi";
import GithubMarkdown from "@components/GithubMarkdown";
import TableOfContents from "@components/TableOfContents";

// Fixed site header is 86px (2px gradient bar + 84px nav).
// Breadcrumb bar below it adds 44px → TOC sticks at 86+44=130px.
const HEADER_HEIGHT = 86;
const BREADCRUMB_HEIGHT = 38;
const TOC_TOP = HEADER_HEIGHT + BREADCRUMB_HEIGHT;

const DeveloperGuideDocPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        setIsLoading(true);
        setError(null);
        fetchDocContent(slug)
            .then((text) => {
                setContent(text);
                setIsLoading(false);
            })
            .catch(() => {
                setError("Failed to load documentation. Please try again.");
                setIsLoading(false);
            });
    }, [slug]);

    const title = useMemo(() => {
        if (!slug) return "";
        return slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    }, [slug]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb — sticks just below the fixed site header */}
            <div
                className="sticky z-40 bg-white border-b border-slate-200 shadow-sm mt-4"
                style={{ top: HEADER_HEIGHT }}
            >
                <div className="container mx-auto px-6 h-11 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.DEVELOPER_GUIDE)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <FiArrowLeft size={14} />
                        Developer Guide
                    </button>
                    <span className="text-slate-300 text-sm">/</span>
                    <span className="text-sm font-semibold text-slate-800 truncate">{title}</span>
                </div>
            </div>

            {isLoading ? (
                <div className="container mx-auto px-6 py-16 flex justify-center">
                    <div className="w-full max-w-4xl space-y-4 animate-pulse">
                        <div className="h-7 bg-slate-200 rounded w-1/3" />
                        <div className="h-3.5 bg-slate-100 rounded w-full" />
                        <div className="h-3.5 bg-slate-100 rounded w-5/6" />
                        <div className="h-3.5 bg-slate-100 rounded w-4/6" />
                        <div className="h-28 bg-slate-100 rounded w-full mt-4" />
                        <div className="h-3.5 bg-slate-100 rounded w-full" />
                        <div className="h-3.5 bg-slate-100 rounded w-5/6" />
                    </div>
                </div>
            ) : error ? (
                <div className="container mx-auto px-6 py-16 text-center">
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            ) : (
                <div className="container mx-auto px-6 py-8">
                    <div className="flex gap-7 items-start">
                        {/* TOC sidebar */}
                        <TableOfContents
                            content={content}
                            className="hidden lg:block w-80 flex-shrink-0 self-start sticky overflow-y-auto"
                            style={{
                                top: TOC_TOP,
                                maxHeight: `calc(100vh - ${TOC_TOP}px)`,
                            }}
                        />

                        {/* Main content */}
                        <main className="flex-1 min-w-0">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-2">
                                    <GithubMarkdown content={content} />
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeveloperGuideDocPage;
