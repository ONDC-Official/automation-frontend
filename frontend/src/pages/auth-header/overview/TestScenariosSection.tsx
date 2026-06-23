import { FC } from "react";
import ScenarioTable from "@pages/auth-header/overview/ScenarioTable";
import {
    payloadFormatScenarios,
    keyScenarios,
    timestampScenarios,
    payloadModificationScenarios,
    commonIssues,
} from "@pages/auth-header/overview/data";

const cardShell =
    "rounded-xl border border-n-40 bg-white p-6 dark:border-n-60 dark:bg-surface-elevated";

const TestScenariosSection: FC = () => (
    <div className={cardShell}>
        <h3 className="mb-4 text-xl font-bold text-n-900 dark:text-n-0">Test Scenarios & FAQs</h3>
        <p className="mb-6 text-body-2 text-n-300 dark:text-n-60">
            Common scenarios and their expected outcomes when signing and verifying ONDC
            authorization headers.
        </p>

        <ScenarioTable
            title="Payload Format Scenarios"
            emoji="📦"
            headers={["Signing Payload", "Verification Payload", "Result", "Reason"]}
            rows={payloadFormatScenarios}
        />

        <ScenarioTable
            title="Key Scenarios"
            emoji="🔑"
            headers={["Signing Key", "Verification Key", "Result", "Reason / Language Support"]}
            rows={keyScenarios}
            note={
                <div className="rounded-lg border border-n-40 bg-brand-light p-3 dark:border-n-60 dark:bg-brand-normal/10">
                    <p className="text-body-2 text-n-300 dark:text-n-60">
                        <strong className="text-n-900 dark:text-n-0">
                            📌 Key Size by Language:
                        </strong>
                        <br />• <strong>32-byte (seed):</strong> Go, Rust, Java (BouncyCastle)
                        <br />• <strong>64-byte (expanded):</strong> Python (PyNaCl), Node.js
                        (libsodium), PHP (sodium)
                        <br />• <strong>Both supported:</strong> Our implementations handle both
                        formats automatically
                    </p>
                </div>
            }
        />

        <ScenarioTable
            title="Timestamp Scenarios"
            emoji="⏰"
            headers={["Scenario", "Created", "Expires", "Result"]}
            rows={timestampScenarios}
        />

        <ScenarioTable
            title="Payload Modification Scenarios"
            emoji="📝"
            headers={["Modification Type", "Example", "Result", "Reason"]}
            rows={payloadModificationScenarios}
        />

        <div className="rounded-lg border border-alert-200 bg-alert-50 p-4 dark:border-alert-500/30 dark:bg-alert-500/10">
            <h4 className="mb-3 font-semibold text-n-900 dark:text-n-0">
                ⚠️ Common Implementation Issues
            </h4>
            <ul className="space-y-2 text-body-2 text-n-300 dark:text-n-60">
                {commonIssues.map((item, index) => (
                    <li key={index}>
                        <strong className="text-n-900 dark:text-n-0">Issue:</strong> {item.issue} →{" "}
                        <strong className="text-n-900 dark:text-n-0">Solution:</strong>{" "}
                        {item.solution}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default TestScenariosSection;
