import { FC } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { SIGNING_STRING_FORMAT, AUTH_HEADER_FORMAT } from "@pages/auth-header/overview/data";

const cardShell =
    "rounded-xl border border-n-40 bg-white p-6 dark:border-n-60 dark:bg-surface-elevated";

const HeaderFormatSection: FC = () => (
    <div className={cardShell}>
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-n-40 bg-brand-light dark:border-n-60 dark:bg-brand-normal/10">
                <DocumentTextIcon className="h-5 w-5 text-brand-normal" aria-hidden />
            </div>
            <h3 className="text-xl font-bold text-n-900 dark:text-n-0">Header Format</h3>
        </div>

        <div className="space-y-4">
            <div>
                <h4 className="mb-2 font-semibold text-n-900 dark:text-n-0">
                    Signing String Structure:
                </h4>
                <div className="overflow-x-auto rounded-lg bg-n-900 p-4 dark:bg-black">
                    <pre className="font-mono text-body-2 text-success-500">
                        {SIGNING_STRING_FORMAT}
                    </pre>
                </div>
            </div>

            <div>
                <h4 className="mb-2 font-semibold text-n-900 dark:text-n-0">
                    Authorization Header Format:
                </h4>
                <div className="overflow-x-auto rounded-lg bg-n-900 p-4 dark:bg-black">
                    <pre className="whitespace-pre-wrap font-mono text-body-2 text-success-500">
                        {AUTH_HEADER_FORMAT}
                    </pre>
                </div>
            </div>

            <div className="rounded-lg border border-n-40 bg-brand-light p-4 dark:border-n-60 dark:bg-brand-normal/10">
                <h4 className="mb-2 font-semibold text-n-900 dark:text-n-0">Key Parameters:</h4>
                <ul className="space-y-1 text-body-2 text-n-300 dark:text-n-60">
                    <li>
                        <strong className="text-n-900 dark:text-n-0">keyId:</strong> Format is
                        "subscriber_id|unique_key_id|ed25519"
                    </li>
                    <li>
                        <strong className="text-n-900 dark:text-n-0">created/expires:</strong> Unix
                        timestamps for validity window
                    </li>
                    <li>
                        <strong className="text-n-900 dark:text-n-0">ttl:</strong> Typically 3600
                        seconds (1 hour)
                    </li>
                    <li>
                        <strong className="text-n-900 dark:text-n-0">signature:</strong>{" "}
                        Base64-encoded Ed25519 signature
                    </li>
                </ul>
            </div>
        </div>
    </div>
);

export default HeaderFormatSection;
