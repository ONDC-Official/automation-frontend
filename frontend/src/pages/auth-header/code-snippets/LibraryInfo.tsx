import { FC } from "react";
import { LIBRARY_INFO } from "@pages/auth-header/code-snippets/data";

const LibraryInfo: FC = () => (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">
            <strong>Note:</strong> These code snippets use the following cryptographic libraries:
        </p>
        <ul className="text-amber-700 text-sm mt-2 list-disc list-inside">
            {LIBRARY_INFO.map(({ language, library }) => (
                <li key={language}>
                    <strong>{language}:</strong> {library}
                </li>
            ))}
        </ul>
    </div>
);

export default LibraryInfo;
