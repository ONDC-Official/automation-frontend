import { StyleSheet } from "@react-pdf/renderer";

import {
    PRINT_BORDER,
    PRINT_GRID,
    PRINT_INK,
    PRINT_MUTED,
    PRINT_SURFACE,
} from "@pages/business-dashboard/components/Chart/constants";

/** A4 portrait at 72dpi, less the page margin — the drawable width for a chart. */
export const PAGE_MARGIN = 36;
export const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2;
export const CHART_HEIGHT = 190;

/**
 * Print styling. Deliberately built on react-pdf's bundled Helvetica rather
 * than a registered web font: the feature is meant to work with no backend, and
 * `Font.register` would put a network fetch in the middle of a download click.
 */
export const styles = StyleSheet.create({
    page: {
        backgroundColor: PRINT_SURFACE,
        color: PRINT_INK,
        fontFamily: "Helvetica",
        fontSize: 9,
        paddingHorizontal: PAGE_MARGIN,
        paddingTop: PAGE_MARGIN,
        paddingBottom: PAGE_MARGIN + 16,
    },

    title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
    subtitle: { fontSize: 9, color: PRINT_MUTED, marginTop: 3 },

    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderBottomWidth: 1,
        borderBottomColor: PRINT_BORDER,
        paddingBottom: 8,
        marginBottom: 14,
    },

    kpiRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 16 },
    kpiTile: {
        flex: 1,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: PRINT_BORDER,
        borderRadius: 4,
        padding: 8,
    },
    kpiLabel: { fontSize: 7.5, color: PRINT_MUTED, textTransform: "uppercase" },
    kpiValue: { fontSize: 15, fontFamily: "Helvetica-Bold", marginTop: 3 },
    kpiHint: { fontSize: 7, color: PRINT_MUTED, marginTop: 2 },

    panel: { marginBottom: 16 },
    panelTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
    panelDescription: { fontSize: 8, color: PRINT_MUTED, marginTop: 2 },

    legendRow: { flexDirection: "row", marginTop: 6, marginBottom: 2 },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
    },
    legendSwatch: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    legendLabel: { fontSize: 8, color: PRINT_MUTED },

    tableHeaderRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: PRINT_BORDER,
        paddingBottom: 3,
        marginTop: 6,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: PRINT_GRID,
        paddingVertical: 2.5,
    },
    tableHeadCell: {
        fontSize: 7.5,
        color: PRINT_MUTED,
        fontFamily: "Helvetica-Bold",
    },
    tableCell: { fontSize: 8 },

    footer: {
        position: "absolute",
        bottom: PAGE_MARGIN / 2,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 7.5,
        color: PRINT_MUTED,
    },
});
