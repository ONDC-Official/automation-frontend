import { type FC } from "react";

interface ErrorStateProps {
    message: string;
}

const ErrorState: FC<ErrorStateProps> = ({ message }) => (
    <div className="shrink-0 mb-3 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm">
        {message}
    </div>
);

export default ErrorState;
