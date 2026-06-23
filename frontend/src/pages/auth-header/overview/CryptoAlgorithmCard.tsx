import { FC } from "react";
import { CryptoAlgorithmCardProps } from "@pages/auth-header/overview/types";

const cardShell =
    "rounded-xl border border-n-40 bg-white p-6 dark:border-border-default dark:bg-surface-elevated";

const CryptoAlgorithmCard: FC<CryptoAlgorithmCardProps> = ({ algorithm }) => (
    <div className={cardShell}>
        <div className="mb-4 flex items-center gap-3">
            <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${algorithm.iconBgColor}`}
            >
                <span className={algorithm.iconTextColor}>{algorithm.icon}</span>
            </div>
            <h3 className="text-xl font-bold text-n-900 dark:text-n-0">{algorithm.title}</h3>
        </div>
        <div className="space-y-3 text-n-300 dark:text-n-60">
            <p>{algorithm.description}</p>
            <ul className="list-inside list-disc space-y-1 text-body-2">
                {algorithm.details.map((detail, index) => (
                    <li key={index}>
                        <strong className="text-n-900 dark:text-n-0">{detail.label}:</strong>{" "}
                        {detail.value}
                    </li>
                ))}
            </ul>
            <div className="mt-3 rounded-lg bg-n-20 p-3 dark:bg-surface-muted">
                <code className="text-caption-2-size text-n-900 dark:text-n-0">
                    {algorithm.codeExample}
                </code>
            </div>
        </div>
    </div>
);

export default CryptoAlgorithmCard;
