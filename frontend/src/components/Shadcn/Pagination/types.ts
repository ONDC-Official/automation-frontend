export type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    /** Blocks navigation while a page is in flight, so clicks cannot be queued. */
    disabled?: boolean;
    className?: string;
};
