import { Link } from "react-router-dom";
import { trackEvent } from "@utils/analytics";
import { IFooterLinkItemProps } from "@/components/Footer/types";

export const FooterLinkItem = ({ link }: IFooterLinkItemProps) => (
    <li onClick={() => trackEvent(link.analytics)}>
        {link.href.startsWith("/") ? (
            <Link
                to={link.href}
                className="text-n-60 hover:text-brand-light transition-colors text-body-2 inline-block"
            >
                {link.name}
            </Link>
        ) : (
            <a
                href={link.href}
                className="text-n-60 hover:text-brand-light transition-colors text-body-2 inline-block"
            >
                {link.name}
            </a>
        )}
    </li>
);
