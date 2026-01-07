import type { ReactNode, FC } from "react";
import { ScenarioTableProps } from "@pages/auth-header/overview/types";

/**
 * Generates CSS class name for table rows to create alternating zebra-stripe effect.
 * Even-indexed rows (0, 2, 4...) get no background, odd-indexed rows get a light gray background.
 *
 * @param {number} index - The zero-based index of the row in the table
 * @returns {string} CSS class name for the row (empty string for even rows, "bg-gray-50" for odd rows)
 */
const getRowClassName = (index: number) => {
  return index % 2 === 0 ? "" : "bg-gray-50";
};

/**
 * Determines CSS class names for table cells based on their content.
 * Applies semantic styling for cells containing status indicators:
 * - ✓ (checkmark) → green text with semibold weight
 * - ✗ (cross) → red text with semibold weight
 * - ⚠ (warning) → amber text with semibold weight
 *
 * @param {string | ReactNode} value - The cell value to check for status indicators
 * @returns {string} CSS class names for styling the cell, or empty string if no special styling needed
 */
const getCellClassName = (value: string | ReactNode) => {
  if (typeof value === "string") {
    if (value.startsWith("✓")) {
      return "text-green-600 font-semibold";
    }
    if (value.startsWith("✗")) {
      return "text-red-600 font-semibold";
    }
    if (value.startsWith("⚠")) {
      return "text-amber-600 font-semibold";
    }
  }
  return "";
};

/**
 * Normalizes a table header string to a camelCase key format for object property lookup.
 * Converts headers like "Header Name" or "Header/Name" to "headerName" or "header/Name".
 * Handles slashes by preserving them and capitalizing the first letter after each slash.
 *
 * @param {string} header - The original header text to normalize
 * @returns {string} Normalized camelCase string suitable for use as an object key
 * @example
 * normalizeHeader("Request Method") // returns "requestMethod"
 * normalizeHeader("Auth Header / Signature") // returns "authHeader/Signature"
 */
const normalizeHeader = (header: string): string => {
  const normalized = header
    .toLowerCase()
    .replace(/\s*\/\s*/g, "/")
    .split(" ")
    .map((word, index) => {
      if (word.includes("/")) {
        return word
          .split("/")
          .map((w, i) => (i === 0 && index === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
          .join("/");
      }
      return index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
  return normalized;
};

const ScenarioTable: FC<ScenarioTableProps> = ({ title, emoji, headers, rows, note }) => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold text-gray-800 mb-3">
      {emoji} {title}
    </h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, index) => (
              <th key={index} className="border border-gray-300 px-4 py-2 text-left">
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
                  <td key={colIndex} className={`border border-gray-300 px-4 py-2 ${getCellClassName(cellValue)}`}>
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
