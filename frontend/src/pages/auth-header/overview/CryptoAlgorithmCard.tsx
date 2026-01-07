import { FC } from "react";
import { CryptoAlgorithmCardProps } from "@pages/auth-header/overview/types";

const CryptoAlgorithmCard: FC<CryptoAlgorithmCardProps> = ({ algorithm }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 ${algorithm.iconBgColor} rounded-xl flex items-center justify-center`}>
        <span className={algorithm.iconTextColor}>{algorithm.icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900">{algorithm.title}</h3>
    </div>
    <div className="space-y-3 text-gray-700">
      <p>{algorithm.description}</p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {algorithm.details.map((detail, index) => (
          <li key={index}>
            <strong>{detail.label}:</strong> {detail.value}
          </li>
        ))}
      </ul>
      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <code className="text-xs text-gray-800">{algorithm.codeExample}</code>
      </div>
    </div>
  </div>
);

export default CryptoAlgorithmCard;
