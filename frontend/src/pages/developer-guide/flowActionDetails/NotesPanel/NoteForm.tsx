import { type FC } from "react";
import { Button } from "@/components/Shadcn/Button/button";
import { Textarea } from "@/components/Shadcn/ComboBox/textarea";
import { Input } from "@/components/Shadcn/TextField/input";

interface NoteFormProps {
    title: string;
    content: string;
    isEditing: boolean;
    onTitleChange: (value: string) => void;
    onContentChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

const NoteForm: FC<NoteFormProps> = ({
    title,
    content,
    isEditing,
    onTitleChange,
    onContentChange,
    onSave,
    onCancel,
}) => (
    <div className="shrink-0 mb-4 p-4 rounded-2xl bg-white dark:bg-surface-elevated border border-slate-200/80 shadow-xs">
        <Input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 bg-slate-50/80 dark:bg-surface-muted/80 rounded-xl border-0 shadow-none focus-visible:ring-2 focus-visible:ring-amber-500/20 focus:bg-white dark:focus:bg-surface-elevated mb-2 transition-colors"
        />
        <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Write your note..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/80 dark:bg-surface-muted/80 rounded-xl border-0 shadow-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white dark:focus:bg-surface-elevated resize-none transition-colors"
        />
        <div className="flex gap-2 mt-2">
            <Button
                type="button"
                variant="ghost"
                onClick={onSave}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-xs transition-colors"
            >
                {isEditing ? "Save" : "Add"}
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
                Cancel
            </Button>
        </div>
    </div>
);

export default NoteForm;
