import { FC } from "react";
import { formatErrorPath } from "@utils/format-error-path";
import type { IErrorItemProps } from "@components/PayloadEditor/types";

export const ErrorItem: FC<IErrorItemProps> = ({ error }) => (
    <div role="alert" className="py-2">
        <p className="text-body-2 font-bold text-destructive mb-1">{error.code}</p>
        {error.path && (
            <p className="inline-block bg-destructive/10 text-destructive text-caption-1 font-mono px-2 py-1 rounded mb-2">
                {formatErrorPath(error.path)}
            </p>
        )}
        <p className="text-body-2 text-n-300 capitalize">{error.message}</p>
    </div>
);
