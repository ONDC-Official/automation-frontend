import { useMemo, type FC } from "react";
import GithubMarkdown from "@components/GithubMarkdown";
import { stripRedundantMarkdownHorizontalRules } from "@utils/markdownToc";

interface AdditionalResourcesViewProps {
    docs: Record<string, string>;
}

/**
 * Renders the "Additional Resources" docs — reference links and supplementary
 * material kept out of the Use Case Brief tab — as sections of one single page,
 * in the order given by `docs` (see `resolveAdditionalResourcesDocs`), rather than
 * as separate tabs.
 */
const AdditionalResourcesView: FC<AdditionalResourcesViewProps> = ({ docs }) => {
    const slugs = useMemo(() => Object.keys(docs), [docs]);

    if (slugs.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 py-6">
            <div className="min-h-[60vh] rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated p-4 flex flex-col gap-10">
                {slugs.map((slug) => {
                    const displayContent = stripRedundantMarkdownHorizontalRules(docs[slug] ?? "");
                    return (
                        <section key={slug}>
                            <GithubMarkdown content={displayContent} />
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

export default AdditionalResourcesView;
