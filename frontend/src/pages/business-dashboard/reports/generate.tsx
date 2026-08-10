import { pdf } from "@react-pdf/renderer";

import OverviewReport, { type IReportInput } from "./OverviewReport";

/**
 * Renders the report and hands the browser a file. `@react-pdf/renderer` and the
 * document tree are a large dependency for a button almost nobody presses on any
 * given visit, so callers reach this module through a dynamic `import()` and it
 * lands in its own chunk — nothing here is in the initial bundle.
 */
export async function downloadOverviewReport(input: IReportInput) {
    const blob = await pdf(<OverviewReport {...input} />).toBlob();
    const url = URL.createObjectURL(blob);

    try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `workbench-overview_${input.range.from ?? "start"}_${input.range.to ?? "today"}.pdf`;
        anchor.rel = "noopener";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
    } finally {
        // Safari needs the URL to outlive the click; a task turn is enough.
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}

export type { IReportInput };
