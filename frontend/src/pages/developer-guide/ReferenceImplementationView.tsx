import { type FC } from "react";
import { ArrowUpRightIcon, PaintBrushIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";

interface ReferenceImplementationViewProps {
    figmaUrl: string;
}

const ReferenceImplementationView: FC<ReferenceImplementationViewProps> = ({ figmaUrl }) => {
    return (
        <div className="w-full flex flex-col gap-6 py-6">
            <div className="rounded-xl border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                        <PaintBrushIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Figma Design Reference
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Explore the UI specs, screen flows, and wireframes on Figma.
                        </p>
                    </div>
                </div>
                <Button
                    asChild
                    className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white font-medium gap-2"
                >
                    <a href={figmaUrl} target="_blank" rel="noopener noreferrer">
                        <span>Open Figma Design</span>
                        <ArrowUpRightIcon className="w-4 h-4" />
                    </a>
                </Button>
            </div>

            <div className="w-full h-[700px] rounded-xl border border-slate-200 dark:border-border-default overflow-hidden bg-slate-50 dark:bg-surface-muted shadow-sm">
                <iframe
                    className="w-full h-full border-0"
                    src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaUrl)}`}
                    allowFullScreen
                    title="Figma Reference Implementation"
                />
            </div>
        </div>
    );
};

export default ReferenceImplementationView;
