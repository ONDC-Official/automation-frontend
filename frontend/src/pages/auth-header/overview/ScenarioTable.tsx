import type { ReactNode, FC } from "react";
import { ScenarioTableProps } from "@pages/auth-header/overview/types";

const getRowClassName = (index: number) => (index % 2 === 0 ? "" : "bg-n-20 dark:bg-surface-muted");

const getCellClassName = (value: string | ReactNode) => {
    if (typeof value === "string") {
        if (value.startsWith("✓")) {
            return "font-semibold text-success-500";
        }
        if (value.startsWith("✗")) {
            return "font-semibold text-error-500";
        }
        if (value.startsWith("⚠")) {
            return "font-semibold text-alert-500";
        }
    }
    return "text-n-300 dark:text-n-60";
};

const normalizeHeader = (header: string): string => {
    const normalized = header
        .toLowerCase()
        .replace(/\s*\/\s*/g, "/")
        .split(" ")
        .map((word, index) => {
            if (word.includes("/")) {
                return word
                    .split("/")
                    .map((w, i) =>
                        i === 0 && index === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)
                    )
                    .join("/");
            }
            return index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
    return normalized;
};

const ScenarioTable: FC<ScenarioTableProps> = ({ title, emoji, headers, rows, note }) => (
    <div className="mb-8">
        <h4 className="mb-3 text-lg font-semibold text-n-900 dark:text-n-0">
            {emoji} {title}
        </h4>
        <div className="overflow-x-auto rounded-lg border border-n-40 dark:border-n-60">
            <table className="w-full border-collapse text-body-2">
                <thead>
                    <tr className="bg-n-20 dark:bg-surface-muted">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                className="border border-n-40 px-4 py-2 text-left font-semibold text-n-900 dark:border-n-60 dark:text-n-0"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={getRowClassName(rowIndex)}>
                            {headers.map((header, colIndex) => {
                                const key = normalizeHeader(header);
                                const cellValue = row[key] ?? row[header] ?? "";
                                return (
                                    <td
                                        key={colIndex}
                                        className={`border border-n-40 px-4 py-2 dark:border-n-60 ${getCellClassName(cellValue)}`}
                                    >
                                        {cellValue}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {note && <div className="mt-3">{note}</div>}
    </div>
);

export default ScenarioTable;
