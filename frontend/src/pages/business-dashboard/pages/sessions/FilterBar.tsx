import { RotateCcw } from "lucide-react";
import { Button } from "@components/Shadcn/Button";
import DateRangePicker from "@components/DateRangePicker";
import FacetSelect from "@pages/business-dashboard/components/FacetSelect";
import SearchInput from "@pages/business-dashboard/components/SearchInput";
import { useOptimisticValue } from "@pages/business-dashboard/hooks/useOptimisticValue";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/Shadcn/Select/select";
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

/**
 * A filter select over a fixed option list.
 *
 * Local-echoes its value for the same reason FacetSelect does: Radix drops a
 * pick that equals the currently rendered value, and the URL those values come
 * from commits inside a React transition, so the rendered value lags.
 */
const OptionSelect = ({
    value,
    options,
    label,
    className,
    onChange,
}: {
    value: string;
    options: ReadonlyArray<{ value: string; label: string }>;
    label: string;
    className: string;
    onChange: (value: string) => void;
}) => {
    const [selected, setSelected] = useOptimisticValue(value);

    return (
        <Select
            value={selected}
            onValueChange={(next) => {
                setSelected(next);
                onChange(next);
            }}
        >
            <SelectTrigger className={className} aria-label={label}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
        <SearchInput
            value={filters.q}
            placeholder="Search session id"
            label="Search session id"
            onChange={(q) => onFilterChange({ q })}
        />

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

        <OptionSelect
            value={filters.result ?? ANY_VALUE}
            options={RESULT_OPTIONS}
            label="Result"
            className="w-36"
            onChange={(value) =>
                onFilterChange({
                    result: value === ANY_VALUE ? undefined : (value as SessionResult),
                })
            }
        />

        <OptionSelect
            value={filters.reportExists === undefined ? ANY_VALUE : String(filters.reportExists)}
            options={REPORT_OPTIONS}
            label="Report state"
            className="w-44"
            onChange={(value) =>
                onFilterChange({
                    reportExists: value === ANY_VALUE ? undefined : value === "true",
                })
            }
        />

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
