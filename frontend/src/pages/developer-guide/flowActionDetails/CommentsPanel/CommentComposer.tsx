import { type FC } from "react";
import { Button } from "@/components/Shadcn/Button";
import { Textarea } from "@/components/Shadcn/TextArea/text-area";
import { cn } from "@/lib/utils";

interface CommentComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    className?: string;
    /** Extra classes on the textarea itself, e.g. to cap auto-grow height in a small popover. */
    textareaClassName?: string;
}

const CommentComposer: FC<CommentComposerProps> = ({
    value,
    onChange,
    onSubmit,
    className,
    textareaClassName,
}) => (
    <div
        className={cn(
            "shrink-0 mb-4 p-4 rounded-2xl bg-white dark:bg-surface-elevated border border-slate-200/80 shadow-xs",
            className
        )}
    >
        <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className={cn(
                "w-full px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/80 dark:bg-surface-muted/80 rounded-xl border-0 shadow-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-surface-elevated resize-none transition-colors",
                textareaClassName
            )}
        />
        <div className="flex justify-end mt-2">
            <Button
                type="button"
                variant="ghost"
                onClick={onSubmit}
                disabled={!value.trim()}
                className="px-4 py-2 text-sm font-medium bg-brand-normal text-n-0 rounded-xl hover:bg-brand-normal-hover hover:text-n-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
                Post
            </Button>
        </div>
    </div>
);

export default CommentComposer;
