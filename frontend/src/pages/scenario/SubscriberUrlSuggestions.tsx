import { useEffect, useMemo, useState } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { useAuth } from "@hooks/useAuth";

const VISIBLE_LIMIT = 6;

const toUrl = (subscriberId: string) =>
    /^https?:\/\//i.test(subscriberId) ? subscriberId : `https://${subscriberId}`;

interface ISubscriberUrlSuggestionsProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
}

/**
 * Suggests subscriber URLs from the subscriber IDs NP Portal lists for the
 * organisation the user is working for. Clicking one fills the field; the user
 * can still edit it, since a subscriber URL may carry a path the ID does not.
 * With exactly one subscriber ID, an empty field is filled in straight away.
 */
export const SubscriberUrlSuggestions = <T extends FieldValues>({
    control,
    name,
}: ISubscriberUrlSuggestionsProps<T>) => {
    const { user } = useAuth();
    const { field } = useController({ control, name });
    const [showAll, setShowAll] = useState(false);

    const suggestions = useMemo(() => {
        const org = user?.organisations?.find((o) => o.organisationId === user.organisationId);
        return [...new Set((org?.subscriberIds ?? []).filter(Boolean).map(toUrl))];
    }, [user]);

    const value = typeof field.value === "string" ? field.value.trim() : "";
    const { onChange } = field;

    useEffect(() => {
        if (suggestions.length === 1 && !value) {
            onChange(suggestions[0]);
        }
        // Only when the organisation's list changes, so a cleared field stays cleared.
    }, [suggestions]);

    if (suggestions.length === 0) {
        return null;
    }

    const query = value.replace(/^https?:\/\//i, "").toLowerCase();
    const matches =
        query && !suggestions.includes(value)
            ? suggestions.filter((s) => s.toLowerCase().includes(query))
            : suggestions;
    if (matches.length === 0) {
        return null;
    }
    const visible = showAll ? matches : matches.slice(0, VISIBLE_LIMIT);
    const hidden = matches.length - visible.length;

    return (
        <div className="-mt-2 space-y-1.5">
            <p className="text-caption-1 text-text-secondary">
                From {user?.organisationName ?? "your organisation"}:
            </p>
            <div className="flex flex-wrap gap-1.5">
                {visible.map((url) => {
                    const isSelected = url === value;
                    return (
                        <button
                            key={url}
                            type="button"
                            onClick={() => onChange(url)}
                            aria-pressed={isSelected}
                            title={url}
                            className={
                                isSelected
                                    ? "max-w-full truncate rounded-full border border-brand-normal bg-brand-light px-2.5 py-0.5 font-mono text-caption-1 text-brand-normal"
                                    : "max-w-full truncate rounded-full border border-border-default bg-surface-muted px-2.5 py-0.5 font-mono text-caption-1 text-text-primary hover:border-brand-normal hover:text-brand-normal"
                            }
                        >
                            {url.replace(/^https?:\/\//i, "")}
                        </button>
                    );
                })}
                {hidden > 0 || showAll ? (
                    <button
                        type="button"
                        onClick={() => setShowAll((v) => !v)}
                        className="px-1 text-caption-1 font-medium text-brand-normal hover:underline"
                    >
                        {showAll ? "Show less" : `+${hidden} more`}
                    </button>
                ) : null}
            </div>
        </div>
    );
};
