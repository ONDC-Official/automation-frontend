import { FC } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

import { IPathLink } from "@pages/home/types";

interface PathCardLinksProps {
    links: IPathLink[];
}

const PathCardLinks: FC<PathCardLinksProps> = ({ links }) => (
    <ul className="space-y-3 w-full">
        {links.map((link) => (
            <li key={link.label}>
                {link.external ? (
                    <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-body-2 text-n-500 hover:text-brand-normal transition-colors group dark:text-n-60"
                    >
                        <ArrowRightIcon className="size-4 text-brand-normal shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        {link.label}
                    </a>
                ) : (
                    <Link
                        to={link.href}
                        className="flex items-center gap-2 text-body-2 text-n-500 hover:text-brand-normal transition-colors group dark:text-n-60"
                    >
                        <ArrowRightIcon className="size-4 text-brand-normal shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        {link.label}
                    </Link>
                )}
            </li>
        ))}
    </ul>
);

export default PathCardLinks;
