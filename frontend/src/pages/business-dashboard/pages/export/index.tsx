import { Link } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import { Download, ListFilter } from "lucide-react";

import { Button } from "@components/Shadcn/Button";
import PageHeader from "@components/PageHeader";
import { useExportPage } from "./useExportPage";
import ColumnPicker from "./ColumnPicker";
import ExportPreview from "./ExportPreview";

const Export = () => {
    const {
        filters,
        backToSessionsSearch,
        selected,
        columns,
        onToggleColumn,
        onSelectAll,
        onSelectDefaults,
        previewRows,
        matchingRows,
        isPreviewLoading,
        isPreviewError,
        previewErrorMessage,
        isDownloading,
        onDownload,
    } = useExportPage();

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Export"
                description="Builds a CSV from the same filters the Sessions page is using — download exactly what you were looking at."
                actions={
                    <>
                        <Button variant="outline" size="sm" asChild>
                            <Link
                                to={{
                                    pathname: ROUTES.BUSINESS_SESSIONS,
                                    search: backToSessionsSearch,
                                }}
                            >
                                <ListFilter />
                                Adjust filters
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            disabled={isDownloading || columns.length === 0}
                            onClick={onDownload}
                        >
                            <Download />
                            {isDownloading ? "Preparing…" : "Download CSV"}
                        </Button>
                    </>
                }
            />

            <ColumnPicker
                selected={selected}
                onToggleColumn={onToggleColumn}
                onSelectAll={onSelectAll}
                onSelectDefaults={onSelectDefaults}
            />

            <ExportPreview
                filters={filters}
                columns={columns}
                rows={previewRows}
                matchingRows={matchingRows}
                isLoading={isPreviewLoading}
                isError={isPreviewError}
                errorMessage={previewErrorMessage}
            />
        </div>
    );
};

export default Export;
