import { FooterLinkItem } from "@/components/Footer/FooterLinkItem";
import { FooterLinkColumnProps } from "@/components/Footer/types";

export const FooterLinkColumn = ({ title, links }: FooterLinkColumnProps) => (
    <div>
        <h3 className="text-n-0 font-semibold text-body-1 mb-4">{title}</h3>
        <ul className="space-y-3">
            {links.map((link) => (
                <FooterLinkItem key={link.name} link={link} />
            ))}
        </ul>
    </div>
);
