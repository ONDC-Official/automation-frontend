type NoResultsProps = { noResultsText: string; searchTerm: string };

const AppJsonViewerNoResults = ({ noResultsText, searchTerm }: NoResultsProps) => (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
        <svg
            className="w-7 h-7 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
        </svg>
        <span className="text-[12px] text-slate-400">
            {noResultsText} <span className="font-semibold text-slate-600">"{searchTerm}"</span>
        </span>
    </div>
);

export default AppJsonViewerNoResults;
