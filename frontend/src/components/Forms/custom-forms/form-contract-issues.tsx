import { Alert } from "@components/Shadcn/Alert";

import type { IFormContractIssue } from "@components/Forms/utils/html-form-contract";

export interface IFormContractIssuesProps {
    issues: IFormContractIssue[];
    /** One-line note on which contract the form was checked against, if any. */
    contractSummary?: string;
}

const IssueList = ({ issues }: { issues: IFormContractIssue[] }) => (
    <ul className="mt-1 list-inside list-disc space-y-0.5">
        {issues.map((issue, index) => (
            <li key={`${issue.code}-${issue.field ?? index}`} className="wrap-break-word">
                {issue.message}
            </li>
        ))}
    </ul>
);

/**
 * Renders seller-form contract issues above the rebuilt form. Errors are shown loudly but never
 * block submission — submitting a non-compliant form to observe the NACK is a valid test.
 */
export const FormContractIssues = ({ issues, contractSummary }: IFormContractIssuesProps) => {
    if (!issues.length && !contractSummary) return null;

    const errors = issues.filter((issue) => issue.severity === "error");
    const warnings = issues.filter((issue) => issue.severity === "warning");

    return (
        <div className="space-y-2">
            {contractSummary && (
                <p className="text-xs text-text-secondary wrap-break-word">{contractSummary}</p>
            )}
            {errors.length > 0 && (
                <Alert
                    variant="error"
                    message={`Seller form issue${errors.length > 1 ? "s" : ""} (${errors.length})`}
                    description={<IssueList issues={errors} />}
                />
            )}
            {warnings.length > 0 && (
                <Alert
                    variant="warning"
                    message={`Seller form warning${warnings.length > 1 ? "s" : ""} (${warnings.length})`}
                    description={<IssueList issues={warnings} />}
                />
            )}
        </div>
    );
};

export default FormContractIssues;
