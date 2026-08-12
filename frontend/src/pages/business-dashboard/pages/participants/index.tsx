import { Download, RefreshCw, RotateCcw, Search } from "lucide-react";

import { Button } from "@components/Shadcn/Button";
import DateRangePicker from "@components/DateRangePicker";
import { Input } from "@components/Shadcn/Input";
import PageHeader from "@components/PageHeader";
import TablePagination from "@components/TablePagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/Shadcn/Select/select";
import FacetSelect from "@pages/business-dashboard/components/FacetSelect";
import { NP_NULL_SENTINEL } from "@pages/business-dashboard/lib/npFilters";
import { ANY_VALUE, NP_TYPE_OPTIONS } from "./constants";
import ParticipantDetailSheet from "./ParticipantDetailSheet";
import ParticipantsTable from "./ParticipantsTable";
import { useParticipantsPage } from "./useParticipantsPage";

const Participants = () => {
    const {
        filters,
        range,
        isFiltered,
        rows,
        total,
        page,
        limit,
        totalPages,
        isLoading,
        isFetching,
        isError,
        errorMessage,
        onRefresh,
        facets,
        isFacetsLoading,
        selection,
        selectedKey,
        detail,
        selectedRow,
        isDetailLoading,
        isDetailError,
        detailErrorMessage,
        onSelectRow,
        onCloseDetail,
        onFilterChange,
        onRangeChange,
        onPageChange,
        onLimitChange,
        onSortChange,
        onReset,
        isDownloading,
        onDownloadCsv,
    } = useParticipantsPage();

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Participants"
                description="One row per participant, role and domain+version — a host that tested as both BAP and BPP appears twice. Every figure describes the current filter, so narrowing the dates makes “first” mean first in that window."
                actions={
                    <>
                        <DateRangePicker value={range} onChange={onRangeChange} />
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isDownloading}
                            onClick={onDownloadCsv}
                        >
                            <Download />
                            {isDownloading ? "Preparing…" : "Download CSV"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isFetching}
                            onClick={() => onRefresh()}
                        >
                            <RefreshCw />
                            Refresh
                        </Button>
                    </>
                }
            />

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3">
                <div className="relative min-w-56 flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                    <Input
                        value={filters.q ?? ""}
                        onChange={(event) => onFilterChange({ q: event.target.value || undefined })}
                        placeholder="Search subscriber host"
                        aria-label="Search subscriber host"
                        className="pl-8"
                    />
                </div>

                <Select
                    value={filters.npType ?? ANY_VALUE}
                    onValueChange={(value) =>
                        onFilterChange({ npType: value === ANY_VALUE ? undefined : value })
                    }
                >
                    <SelectTrigger className="w-40" aria-label="Role">
                        <SelectValue placeholder="Any role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY_VALUE}>Any role</SelectItem>
                        {NP_TYPE_OPTIONS.map((npType) => (
                            <SelectItem key={npType} value={npType}>
                                {npType}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Splitting by domain and version multiplies the row count, so
                    these two are how the table stays navigable. The facets come
                    from the sessions endpoint, which excludes blanks from every
                    dimension — hence the explicit "None recorded" option, which
                    is the only way to reach the rows the table renders as “—”.
                    That endpoint also does not apply EXCLUDED_HOSTS, so a domain
                    seen only on workbench-proxied sessions can be offered here
                    and select nothing. */}
                <FacetSelect
                    label="Any domain"
                    value={filters.domain}
                    options={facets?.domains ?? []}
                    disabled={isFacetsLoading}
                    extraOptions={[{ value: NP_NULL_SENTINEL, label: "None recorded" }]}
                    onChange={(domain) => onFilterChange({ domain })}
                />

                <FacetSelect
                    label="Any version"
                    value={filters.version}
                    options={facets?.versions ?? []}
                    disabled={isFacetsLoading}
                    extraOptions={[{ value: NP_NULL_SENTINEL, label: "None recorded" }]}
                    onChange={(version) => onFilterChange({ version })}
                />

                {isFiltered && (
                    <Button variant="ghost" size="sm" onClick={onReset}>
                        <RotateCcw />
                        Reset
                    </Button>
                )}
            </div>

            <ParticipantsTable
                rows={rows}
                sort={filters.sort}
                order={filters.order}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                selectedKey={selectedKey}
                onSelectRow={onSelectRow}
                onSortChange={onSortChange}
            />

            <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                disabled={isFetching}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />

            <ParticipantDetailSheet
                selection={selection}
                detail={detail}
                fallback={selectedRow}
                isLoading={isDetailLoading}
                isError={isDetailError}
                errorMessage={detailErrorMessage}
                onClose={onCloseDetail}
            />
        </div>
    );
};

export default Participants;
