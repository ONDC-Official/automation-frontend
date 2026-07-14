import { FC, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

import { useAuth } from "@hooks/useAuth";
import { useGitHubLogin } from "@hooks/useGitHubLogin";
import { IPathLink } from "@pages/home/types";

interface PathCardLinksProps {
    links: IPathLink[];
}

const linkClassName =
    "flex items-center gap-2 text-body-2 text-n-500 hover:text-brand-normal transition-colors group dark:text-n-60";

const PathCardLinks: FC<PathCardLinksProps> = ({ links }) => {
    const { user } = useAuth();
    const { startLogin } = useGitHubLogin();

    const handleAuthRequiredClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
        if (user) {
            return;
        }

        event.preventDefault();
        startLogin(href);
    };

    return (
        <ul className="space-y-3 w-full">
            {links.map((link) => (
                <li key={link.label}>
                    {link.external ? (
                        <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkClassName}
                        >
                            <ArrowRightIcon className="size-4 text-brand-normal shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            {link.label}
                        </a>
                    ) : (
                        <Link
                            to={link.href}
                            onClick={
                                link.requiresAuth ? handleAuthRequiredClick(link.href) : undefined
                            }
                            className={linkClassName}
                        >
                            <ArrowRightIcon className="size-4 text-brand-normal shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            {link.label}
                        </Link>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default PathCardLinks;
