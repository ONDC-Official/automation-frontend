import { FC } from "react";
import ScenarioTable from "@pages/auth-header/overview/ScenarioTable";
import {
  payloadFormatScenarios,
  keyScenarios,
  timestampScenarios,
  payloadModificationScenarios,
  commonIssues,
} from "@pages/auth-header/overview/data";

const TestScenariosSection: FC = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Test Scenarios & FAQs</h3>
    <p className="text-gray-600 mb-6">
      Common scenarios and their expected outcomes when signing and verifying ONDC authorization headers.
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>📌 Key Size by Language:</strong>
            <br />• <strong>32-byte (seed):</strong> Go, Rust, Java (BouncyCastle)
            <br />• <strong>64-byte (expanded):</strong> Python (PyNaCl), Node.js (libsodium), PHP (sodium)
            <br />• <strong>Both supported:</strong> Our implementations handle both formats automatically
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

    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h4 className="font-semibold text-amber-800 mb-3">⚠️ Common Implementation Issues</h4>
      <ul className="text-sm text-amber-900 space-y-2">
        {commonIssues.map((item, index) => (
          <li key={index}>
            <strong>Issue:</strong> {item.issue} → <strong>Solution:</strong> {item.solution}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default TestScenariosSection;
