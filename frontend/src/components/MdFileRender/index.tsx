import { FC } from "react";
import GithubMarkdown from "@components/GithubMarkdown";
import TableOfContents from "@components/TableOfContents";

// Offset: fixed site header (84px) + some breathing room
const TOC_TOP = 100;

interface MdFileRenderProps {
    title: string;
    description?: string;
    mdData: string;
    showTableOfContents?: boolean;
    /** Developer guide pages use a flat layout without card chrome. */
    variant?: "card" | "guide";
}

const MdFileRender: FC<MdFileRenderProps> = ({
    title,
    description,
    mdData,
    showTableOfContents = true,
    variant = "card",
}) => {
    const isGuide = variant === "guide";

    return (
        <section
            className={
                isGuide
                    ? undefined
                    : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
            }
        >
            <header
                className={
                    isGuide
                        ? "mb-6"
                        : "border-b border-slate-100 bg-slate-50 px-6 pb-4 pt-6 md:px-8"
                }
            >
                <h1 className="text-2xl font-bold tracking-tight text-n-900 dark:text-n-0">
                    {title}
                </h1>
                {description && (
                    <p
                        className={
                            isGuide
                                ? "mt-2 text-body-2 font-regular text-n-300 dark:text-n-60"
                                : "mt-2 text-sm text-slate-600"
                        }
                    >
                        {description}
                    </p>
                )}
            </header>
            <div className="flex gap-0">
                {showTableOfContents && (
                    <div className="hidden w-56 shrink-0 border-r border-slate-100 px-3 py-5 lg:block">
                        <TableOfContents
                            content={mdData}
                            className="sticky"
                            style={{ top: TOC_TOP }}
                        />
                    </div>
                )}
                <div
                    className={
                        isGuide
                            ? "prose prose-slate max-w-none flex-1 min-w-0 [&_h2]:mt-8! [&_h2]:mb-2! [&_h2]:border-0! [&_h2]:pb-0! [&_h2]:text-xl! [&_h2]:font-semibold! [&_h2]:text-brand-normal! [&_h2:first-of-type]:mt-0! [&_p]:text-n-900 [&_p]:dark:text-n-0"
                            : "flex-1 min-w-0 px-3 py-3 md:px-4"
                    }
                >
                    <GithubMarkdown content={mdData} />
                </div>
            </div>
        </section>
    );
};

export default MdFileRender;
