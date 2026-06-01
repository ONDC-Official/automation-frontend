import { useMemo, useState } from "react";
import { PiShieldStarBold } from "react-icons/pi";

import { TOOL_DESCRIPTIONS } from "../prompt/tool-descriptions";

export function AvailableToolsBar() {
    const [open, setOpen] = useState(false);
    const tools = useMemo(
        () =>
            TOOL_DESCRIPTIONS.map((t) => ({
                name: t.function.name,
                description: t.function.description,
            })),
        []
    );

    return (
        <div className="border border-gray-200 rounded text-xs bg-gray-50">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-100 text-left"
            >
                <PiShieldStarBold className="text-sky-600 shrink-0" />
                <span className="text-gray-700">
                    Guardian has {tools.length} tool
                    {tools.length === 1 ? "" : "s"} available
                </span>
                <span className="ml-auto text-gray-500">{open ? "hide" : "show"}</span>
            </button>
            {open && (
                <ul className="px-3 py-2 border-t border-gray-200 flex flex-col gap-1 bg-white">
                    {tools.map((t) => (
                        <li key={t.name} className="flex flex-col">
                            <span className="font-mono font-semibold text-gray-800">
                                {t.name}
                            </span>
                            <span className="text-gray-600 text-[11px]">
                                {t.description}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
