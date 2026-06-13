import { FC } from "react";
import type { ISupportInfoItem as SupportInfoItemData } from "@pages/home/types";

interface SupportInfoItemProps {
    item: SupportInfoItemData;
}

const SupportInfoItem: FC<SupportInfoItemProps> = ({ item }) => (
    <div>
        <p className="text-caption-1 font-semibold uppercase tracking-wider text-brand-normal mb-3">
            {item.label}
        </p>
        <p className="text-body-1 font-semibold text-n-800 dark:text-n-0 mb-2">{item.title}</p>
        <p className="text-caption-1 text-n-300 dark:text-n-60">{item.subtitle}</p>
    </div>
);

export default SupportInfoItem;
