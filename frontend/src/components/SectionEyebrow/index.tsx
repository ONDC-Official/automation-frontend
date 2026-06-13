import { FC } from "react";

interface SectionEyebrowProps {
    label: string;
    className?: string;
}

const SectionEyebrow: FC<SectionEyebrowProps> = ({ label, className = "" }) => (
    <p
        className={`text-brand-normal text-caption-1 font-semibold uppercase tracking-widest font-inter mb-3 ${className}`}
    >
        {label}
    </p>
);

export default SectionEyebrow;
