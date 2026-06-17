export const getPageNumbers = (
    currentPage: number,
    totalPages: number
): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [1];

    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let p = start; p <= end; p++) {
        pages.push(p);
    }

    if (currentPage < totalPages - 2) pages.push("ellipsis");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
};
