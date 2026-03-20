import { FC, ReactNode, useId, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";

export interface AccordionSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: ReactNode;
    rightAdornment?: ReactNode;
}

const AccordionSection: FC<AccordionSectionProps> = ({
    title,
    defaultOpen = true,
    children,
    rightAdornment,
}) => {
    const panelId = useId();
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls={panelId}
                >
                    <span className="text-base font-semibold text-gray-900">{title}</span>
                    <span className="flex items-center gap-3">
                        {rightAdornment}
                        <span className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <FaChevronDown
                                className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                            />
                        </span>
                    </span>
                </button>

                <div
                    id={panelId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                    aria-hidden={!open}
                >
                    <div className="overflow-hidden border-t border-gray-100">
                        <div
                            className={`transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}
                        >
                            <div className="p-5">{children}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AccordionSection;
