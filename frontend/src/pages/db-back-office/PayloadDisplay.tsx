import { FC } from "react";
import { PayloadDisplayProps } from "@pages/db-back-office/types";
import AppJsonViewer from "@/components/AppJsonViewer";

const PayloadDisplay: FC<PayloadDisplayProps> = ({ payloadData }) => {
    return (
        <div className="bg-white dark:bg-surface-elevated rounded-xl shadow-lg border border-sky-100 dark:border-border-default p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-text-primary">
                    Payload Data
                </h2>
                <div className="flex gap-2 text-xs">
                    <span className="bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 px-2 py-1 rounded">
                        Domain: {payloadData.domain}
                    </span>
                    <span className="bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        Version: {payloadData.version}
                    </span>
                    {payloadData.page && (
                        <span className="bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            Page: {payloadData.page}
                        </span>
                    )}
                </div>
            </div>

            <div className="border border-sky-200 dark:border-border-default rounded-lg overflow-hidden">
                <AppJsonViewer
                    value={payloadData.data as object}
                    style={{
                        padding: "16px",
                        fontSize: "14px",
                        fontFamily: "JetBrains Mono, Monaco, monospace",
                    }}
                    displayObjectSize={true}
                    enableClipboard={true}
                    collapsed={2}
                />
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-text-secondary text-center">
                Click on objects to expand/collapse - Copy values by clicking the copy icon
            </div>
        </div>
    );
};

export default PayloadDisplay;
