import { useEffect, useRef, useState } from "react";
import { Search, type LucideIcon } from "lucide-react";

import { cn } from "@pages/business-dashboard/lib/utils";
import { Input } from "@components/Shadcn/Input";

interface IProps {
    /** The committed value, which lives in the URL (or the page's filter state). */
    value?: string;
    placeholder: string;
    label: string;
    onChange: (value: string | undefined) => void;
    icon?: LucideIcon;
    className?: string;
    /** Quiet period before committing, in ms. */
    delay?: number;
}

/**
 * The dashboard filter bars' search box, committing on a pause rather than on
 * every keystroke.
 *
 * The value lives in the URL, so committing per character meant one history
 * entry and one API request per character. Those requests were the main source
 * of in-flight work competing with whatever the user did next — pick a role,
 * change a page — on an endpoint slow enough for that to matter.
 *
 * The input is driven by local state so typing stays instant; only the commit
 * waits. An external change to `value` (Reset, browser back, a shared link)
 * overwrites the draft, tracked against the last value we emitted so the
 * component's own commits do not echo back and fight the user mid-word.
 */
const SearchInput = ({
    value,
    placeholder,
    label,
    onChange,
    icon: Icon = Search,
    className,
    delay = 300,
}: IProps) => {
    const [draft, setDraft] = useState(value ?? "");
    const emitted = useRef(value ?? "");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if ((value ?? "") !== emitted.current) {
            emitted.current = value ?? "";
            setDraft(value ?? "");
        }
    }, [value]);

    // A pending commit must not outlive the control, or it fires against an
    // unmounted page and pushes a filter the user has navigated away from.
    useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

    const handleChange = (next: string) => {
        setDraft(next);
        clearTimeout(timer.current ?? undefined);
        timer.current = setTimeout(() => {
            emitted.current = next;
            onChange(next || undefined);
        }, delay);
    };

    return (
        <div className={cn("relative min-w-56 flex-1", className)}>
            <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
                value={draft}
                onChange={(event) => handleChange(event.target.value)}
                placeholder={placeholder}
                aria-label={label}
                className="pl-8"
            />
        </div>
    );
};

export default SearchInput;
