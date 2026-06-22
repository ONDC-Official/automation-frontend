import { type FC } from "react";

interface CommentComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

const CommentComposer: FC<CommentComposerProps> = ({ value, onChange, onSubmit }) => (
    <div className="shrink-0 mb-4 p-4 rounded-2xl bg-white dark:bg-surface-elevated border border-slate-200/80 shadow-xs">
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="w-full px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/80 dark:bg-surface-muted/80 rounded-xl border-0 focus:ring-2 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-surface-elevated resize-none transition-colors"
        />
        <div className="flex justify-end mt-2">
            <button
                type="button"
                onClick={onSubmit}
                disabled={!value.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-xl hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
                Post
            </button>
        </div>
    </div>
);

export default CommentComposer;
