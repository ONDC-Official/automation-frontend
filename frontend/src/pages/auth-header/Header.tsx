import { FC, ReactNode } from "react";
import { KeyIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
    tabs?: ReactNode;
    /** When true, omits standalone-page top offset (developer guide shell). */
    embedded?: boolean;
}

const Header: FC<HeaderProps> = ({ tabs, embedded = false }) => (
    <header className="border-b border-n-40 bg-white dark:border-border-default dark:bg-surface-elevated">
        <div className={`px-10 py-10 md:px-12 md:py-12 ${embedded ? "" : "mt-[18px]"}`}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                <div className="min-w-0 max-w-3xl flex-1">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-n-40 bg-brand-light px-3 py-1.5 text-caption-2-size font-semibold uppercase tracking-widest text-brand-normal dark:border-border-default dark:bg-brand-normal/10">
                        <KeyIcon className="h-2.75 w-2.75" aria-hidden />
                        Auth tools
                    </div>
                    <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-n-900 dark:text-n-0 md:text-4xl">
                        Authorization Header{" "}
                        <span className="text-brand-normal">signing &amp; verification</span>
                    </h1>
                    <p className="max-w-2xl text-body-1 leading-relaxed text-n-300 dark:text-n-60">
                        ONDC uses a cryptographic signature scheme to authenticate API requests
                        between network participants. The authorization header contains a digital
                        signature created using BLAKE-512 hashing and Ed25519 elliptic curve
                        signatures.
                    </p>
                </div>
                {tabs ? <div className="w-full shrink-0 lg:w-auto">{tabs}</div> : null}
            </div>
        </div>
    </header>
);

export default Header;
