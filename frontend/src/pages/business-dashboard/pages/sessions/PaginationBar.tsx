import TablePagination from "@components/TablePagination";

interface IProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    isFetching: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

const PaginationBar = ({
    page,
    totalPages,
    total,
    limit,
    isFetching,
    onPageChange,
    onLimitChange,
}: IProps) => (
    <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        disabled={isFetching}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
    />
);

export default PaginationBar;
