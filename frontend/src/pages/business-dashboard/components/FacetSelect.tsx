import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/Shadcn/Select/select";

/** Sentinel for "no filter" — Radix Select cannot hold an empty string value. */
export const ANY_VALUE = "__any__";

interface IExtraOption {
    /** The value put on the wire when this option is picked. */
    value: string;
    label: string;
}

interface IProps {
    label: string;
    value?: string;
    options: string[];
    disabled: boolean;
    /**
     * Choices the facets endpoint cannot offer. It excludes null and "" from
     * every dimension, so "no domain recorded" has to be supplied here.
     */
    extraOptions?: IExtraOption[];
    onChange: (value: string | undefined) => void;
}

/**
 * A dropdown backed by `GET /api/sessions/facets`.
 *
 * Shared by the Sessions and Participants filter bars — both narrow the same
 * session dimensions, so a second copy would only drift.
 */
const FacetSelect = ({ label, value, options, disabled, extraOptions = [], onChange }: IProps) => {
    // Facets narrow to the active selection, so a dimension's own filter can
    // exclude every other value — and, depending on how the server computes it,
    // possibly the selected one too. Union the selection back in so the control
    // always shows what is selected and can always be cleared.
    const isKnown =
        !value || options.includes(value) || extraOptions.some((o) => o.value === value);
    const items = isKnown ? options : [value, ...options];

    return (
        <Select
            value={value ?? ANY_VALUE}
            disabled={disabled}
            onValueChange={(next) => onChange(next === ANY_VALUE ? undefined : next)}
        >
            <SelectTrigger className="w-44" aria-label={label}>
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ANY_VALUE}>{label}</SelectItem>
                {extraOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
                {items.map((option) => (
                    <SelectItem key={option} value={option}>
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default FacetSelect;
