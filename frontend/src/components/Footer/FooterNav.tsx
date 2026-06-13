import { footerLinkColumns, footerLinks } from "@/components/Footer/constants";
import { FooterLinkColumn } from "@/components/Footer/FooterLinkColumn";

export const FooterNav = () => (
    <div className="flex flex-wrap gap-x-10 lg:gap-x-12 xl:gap-x-16 gap-y-8 shrink-0 lg:justify-end">
        {footerLinkColumns.map((column) => (
            <FooterLinkColumn
                key={column.key}
                title={column.title}
                links={footerLinks[column.key]}
            />
        ))}
    </div>
);
