import { FC } from "react";

export interface ValidationRow {
    rowType: string;
    name: string;
    group: string;
    scope: string;
    description: string;
    skipIf: string;
    errorCode: string;
    successCode: string;
}

export interface ValidationTable {
    action: string;
    codeName: string;
    numLeafTests: number;
    generated: string;
    rows: ValidationRow[];
}

interface ValidationsTableProps {
    rows: ValidationRow[];
}

const ValidationsTable: FC<ValidationsTableProps> = ({ rows }) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="max-h-[540px] overflow-auto">
                <table className="min-w-full table-fixed text-left text-xs">
                    <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                #
                            </th>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                Type
                            </th>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                Test Name
                            </th>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                Group
                            </th>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                Scope
                            </th>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider w-[300px] max-w-[300px]">
                                Description
                            </th>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                Skip If
                            </th>
                            <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                Error Code
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const isGroup = row.rowType === "group";
                            return (
                                <tr
                                    key={`${row.name}-${index}`}
                                    className={
                                        isGroup
                                            ? "bg-slate-50/80 border-t border-slate-200"
                                            : index % 2 === 0
                                              ? "bg-white hover:bg-slate-50/80"
                                              : "bg-slate-50/40 hover:bg-slate-100/80"
                                    }
                                >
                                    <td className="px-3 py-2 align-top text-[11px] text-slate-500 max-w-[200px] whitespace-pre-wrap break-words">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-2 align-top text-[11px] max-w-[200px] whitespace-pre-wrap break-words">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-medium ${
                                                isGroup
                                                    ? "bg-sky-50 text-sky-700 border-sky-100"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            }`}
                                        >
                                            {row.rowType}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 align-top text-xs font-semibold text-slate-800 whitespace-pre-wrap break-words max-w-[200px]">
                                        {row.name}
                                    </td>
                                    <td className="px-3 py-2 align-top text-xs text-slate-600 whitespace-pre-wrap break-words max-w-[200px]">
                                        {row.group}
                                    </td>
                                    <td className="px-3 py-2 align-top text-xs text-slate-600 whitespace-pre-wrap break-words max-w-[200px]">
                                        {row.scope}
                                    </td>
                                    <td className="px-3 py-2 align-top text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed w-[300px] max-w-[300px]">
                                        {row.description}
                                    </td>
                                    <td className="px-3 py-2 align-top text-xs text-slate-500 whitespace-pre-wrap break-words leading-relaxed max-w-[200px]">
                                        {row.skipIf}
                                    </td>
                                    <td className="px-3 py-2 align-top text-xs max-w-[200px] whitespace-pre-wrap break-words">
                                        {row.errorCode ? (
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                                                {row.errorCode}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 font-mono">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ValidationsTable;
