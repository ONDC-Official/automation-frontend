import { FC } from "react";
import { ISectionLabelProps } from "@/components/SectionLabel/types";

const SectionLabel: FC<ISectionLabelProps> = ({ label, className = "" }) => (
    <p
        className={`text-brand-normal text-caption-1 font-semibold uppercase tracking-widest mb-3 ${className}`}
    >
        {label}
    </p>
);

export default SectionLabel;
