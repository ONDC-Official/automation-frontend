import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { trackEvent } from "@utils/analytics";
import { IFooterLinkItemProps } from "@components/Footer/types";

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
                target="_blank"
                rel="noopener noreferrer"
                className="text-n-60 hover:text-brand-light transition-colors text-body-2 inline-flex items-center gap-1"
            >
                {link.name}
                <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0" aria-hidden />
            </a>
        )}
    </li>
);
