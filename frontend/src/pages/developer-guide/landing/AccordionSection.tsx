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
        <section className="mb-10">
            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                <button
                    type="button"
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-white to-sky-50 hover:from-sky-50 hover:to-sky-50/60 transition-colors"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls={panelId}
                >
                    <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                        {title}
                    </span>

                    <span className="flex items-center gap-3">
                        {rightAdornment}
                        <span className="w-9 h-9 rounded-full bg-white/80 border border-sky-100 flex items-center justify-center shadow-sm">
                            <FaChevronDown
                                className={`w-3 h-3 text-sky-600 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
                    <div className="overflow-hidden border-t border-sky-100">
                        <div
                            className={`transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
                        >
                            <div className="p-6">{children}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AccordionSection;
