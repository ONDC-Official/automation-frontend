import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => (
        <div className="relative w-full overflow-auto">
            <table
                ref={ref}
                className={cn("w-full caption-bottom text-body-2", className)}
                {...props}
            />
        </div>
    )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn("[&_tr]:border-b border-n-30 dark:border-border-default", className)}
        {...props}
    />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                // The dark hover/selected tints are brand-normal over the elevated surface, not
                // brand-light: brand-light is a near-white wash that blows out a #141414 row.
                "border-b border-n-30 transition-colors hover:bg-brand-light/40 data-[state=selected]:bg-brand-light/40",
                "dark:border-border-default dark:hover:bg-brand-normal/15 dark:data-[state=selected]:bg-brand-normal/25",
                className
            )}
            {...props}
        />
    )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "h-11 px-4 text-left align-middle text-caption-1 font-semibold tracking-wider text-n-80 bg-n-20 has-[[role=checkbox]]:pr-0",
            // Header band stays one step off whatever surface the table sits on. Dark uses a
            // translucent overlay rather than a fixed grey so it also reads on the detail
            // sheets, whose surface is not the card. n-0 is literal white in both themes —
            // unlike `white`, which .dark remaps to n-800.
            "dark:text-n-60 dark:bg-n-0/5",
            className
        )}
        {...props}
    />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            "px-4 py-3 align-middle text-body-2 text-n-700 dark:text-n-10 has-[[role=checkbox]]:pr-0",
            className
        )}
        {...props}
    />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
