import { Download, RefreshCw, RotateCcw, Search } from "lucide-react";

import { Button } from "@components/Shadcn/Button";
import DateRangePicker from "@components/DateRangePicker";
import { Input } from "@components/Shadcn/Input";
import PageHeader from "@components/PageHeader";
import Pagination from "@pages/business-dashboard/components/Pagination";
import Select, {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@pages/business-dashboard/components/Select";
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
        selectedHost,
        detail,
        selectedRow,
        isDetailLoading,
        isDetailError,
        detailErrorMessage,
        onSelectHost,
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
                description="Who has been testing against the stack, and since when. Every figure describes the current filter — narrow the dates and “first seen” means first in that window."
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
                selectedHost={selectedHost}
                onSelectHost={onSelectHost}
                onSortChange={onSortChange}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                disabled={isFetching}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />

            <ParticipantDetailSheet
                host={selectedHost}
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
