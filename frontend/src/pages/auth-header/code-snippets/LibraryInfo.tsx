import { FC } from "react";
import { LIBRARY_INFO } from "@pages/auth-header/code-snippets/data";

const LibraryInfo: FC = () => (
    <div className="rounded-lg border border-alert-200 bg-alert-50 p-4 dark:border-alert-500/30 dark:bg-alert-500/10">
        <p className="text-body-2 text-n-300 dark:text-n-60">
            <strong className="text-n-900 dark:text-n-0">Note:</strong> These code snippets use the
            following cryptographic libraries:
        </p>
        <ul className="mt-2 list-inside list-disc text-body-2 text-n-300 dark:text-n-60">
            {LIBRARY_INFO.map(({ language, library }) => (
                <li key={language}>
                    <strong className="text-n-900 dark:text-n-0">{language}:</strong> {library}
                </li>
            ))}
        </ul>
    </div>
);

export default LibraryInfo;
