import { RotateCcw, Search } from "lucide-react";
import { Button } from "@components/Shadcn/Button";
import DateRangePicker from "@components/DateRangePicker";
import { Input } from "@components/Shadcn/Input";
import Select, {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@pages/business-dashboard/components/Select";
import type {
    SessionFacets,
    SessionFilters,
    SessionResult,
} from "@pages/business-dashboard/services/types";
import { ANY_VALUE, REPORT_OPTIONS, RESULT_OPTIONS } from "./constants";

interface IProps {
    filters: SessionFilters;
    facets?: SessionFacets;
    isFacetsLoading: boolean;
    isFiltered: boolean;
    onFilterChange: (patch: Partial<SessionFilters>) => void;
    onReset: () => void;
}

interface IFacetSelectProps {
    label: string;
    value?: string;
    options: string[];
    disabled: boolean;
    onChange: (value: string | undefined) => void;
}

const FacetSelect = ({ label, value, options, disabled, onChange }: IFacetSelectProps) => {
    // Facets narrow to the active selection, so a dimension's own filter can
    // exclude every other value — and, depending on how the server computes it,
    // possibly the selected one too. Union the selection back in so the control
    // always shows what is selected and can always be cleared.
    const items = value && !options.includes(value) ? [value, ...options] : options;

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
                {items.map((option) => (
                    <SelectItem key={option} value={option}>
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

/** One filter row above the table, mirrored into the URL by `useSessionsPage`. */
const FilterBar = ({
    filters,
    facets,
    isFacetsLoading,
    isFiltered,
    onFilterChange,
    onReset,
}: IProps) => (
    <div
        data-slot="filter-bar"
        className="border-border bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3"
    >
        <div className="relative min-w-56 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
                value={filters.q ?? ""}
                onChange={(event) => onFilterChange({ q: event.target.value || undefined })}
                placeholder="Search session id"
                aria-label="Search session id"
                className="pl-8"
            />
        </div>

        <DateRangePicker
            value={{ from: filters.from, to: filters.to }}
            onChange={(range) => onFilterChange({ from: range.from, to: range.to })}
        />

        <FacetSelect
            label="Any domain"
            value={filters.domain}
            options={facets?.domains ?? []}
            disabled={isFacetsLoading}
            onChange={(domain) => onFilterChange({ domain })}
        />

        <FacetSelect
            label="Any version"
            value={filters.version}
            options={facets?.versions ?? []}
            disabled={isFacetsLoading}
            onChange={(version) => onFilterChange({ version })}
        />

        <FacetSelect
            label="Any NP type"
            value={filters.npType}
            options={facets?.npTypes ?? []}
            disabled={isFacetsLoading}
            onChange={(npType) => onFilterChange({ npType })}
        />

        <FacetSelect
            label="Any session type"
            value={filters.sessionType}
            options={facets?.sessionTypes ?? []}
            disabled={isFacetsLoading}
            onChange={(sessionType) => onFilterChange({ sessionType })}
        />

        <Select
            value={filters.result ?? ANY_VALUE}
            onValueChange={(value) =>
                onFilterChange({
                    result: value === ANY_VALUE ? undefined : (value as SessionResult),
                })
            }
        >
            <SelectTrigger className="w-36" aria-label="Result">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {RESULT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        <Select
            value={filters.reportExists === undefined ? ANY_VALUE : String(filters.reportExists)}
            onValueChange={(value) =>
                onFilterChange({
                    reportExists: value === ANY_VALUE ? undefined : value === "true",
                })
            }
        >
            <SelectTrigger className="w-44" aria-label="Report state">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {REPORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        <Button
            variant="ghost"
            size="sm"
            disabled={!isFiltered}
            onClick={onReset}
            className="ml-auto"
        >
            <RotateCcw />
            Reset
        </Button>
    </div>
);

export default FilterBar;
