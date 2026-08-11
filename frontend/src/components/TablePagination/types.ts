export interface IProps {
    page: number;
    totalPages: number;
    /** total row count, used for the "1–50 of 1,284" summary */
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    /** page-size options offered in the dropdown */
    limitOptions?: number[];
    disabled?: boolean;
    className?: string;
}
