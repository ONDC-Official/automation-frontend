import { FC } from "react";
import { formatErrorPath } from "@/pages/schema-validation/utils/parseValidationErrors";
import type { IErrorItemProps } from "@/pages/schema-validation/types";

export const ErrorItem: FC<IErrorItemProps> = ({ error }) => (
    <div className="py-2">
        <p className="text-body-2 font-bold text-error-500 mb-1">{error.code}</p>
        {error.path ? (
            <p className="inline-block bg-red-100 text-error-500 text-caption-1 font-mono px-2 py-1 rounded mb-2">
                {formatErrorPath(error.path)}
            </p>
        ) : null}
        <p className="text-body-2 text-n-300 capitalize">{error.message}</p>
    </div>
);
