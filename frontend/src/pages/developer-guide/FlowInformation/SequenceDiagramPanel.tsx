import { type FC, useEffect, useId, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import Spinner from "@components/Shadcn/Spinner";
import EmptyState from "@components/EmptyState";
import { useTheme } from "@/theme/hooks/useTheme";

interface SequenceDiagramPanelProps {
    mermaidSource: string | null;
}

/**
 * Renders a Mermaid sequenceDiagram when the spec provides one; otherwise shows
 * a clear empty state. Mermaid is loaded on demand so inactive tabs stay cheap.
 */
const SequenceDiagramPanel: FC<SequenceDiagramPanelProps> = ({ mermaidSource }) => {
    const reactId = useId().replace(/:/g, "");
    const containerId = `flow-seq-${reactId}`;
    const { isDark } = useTheme();
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(!!mermaidSource);

    useEffect(() => {
        let cancelled = false;

        if (!mermaidSource) {
            setSvg(null);
            setError(null);
            setLoading(false);
            return;
        }

        async function render() {
            setLoading(true);
            setError(null);
            setSvg(null);
            try {
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: "strict",
                    theme: isDark ? "dark" : "default",
                    flowchart: { htmlLabels: false },
                });
                const { svg: rendered } = await mermaid.render(
                    `${containerId}-${Date.now()}`,
                    mermaidSource!
                );
                if (!cancelled) setSvg(rendered);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Failed to render sequence diagram");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void render();
        return () => {
            cancelled = true;
        };
    }, [mermaidSource, isDark, containerId]);

    if (!mermaidSource) {
        return (
            <div className="flex-1 min-h-60 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border-default bg-slate-50/60 dark:bg-surface-muted/40 px-6">
                <EmptyState
                    icon={ArrowsRightLeftIcon}
                    message="Sequence diagram is not available for this flow."
                    hint="A diagram will appear here when the protocol specification includes one."
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="relative w-full flex-1 min-h-[calc(100vh-14rem)] rounded-xl border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="size-8 text-brand-normal" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                Could not render sequence diagram: {error}
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated p-4">
            <div
                className="flex justify-center [&_svg]:max-w-full"
                dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
            />
        </div>
    );
};

export default SequenceDiagramPanel;
