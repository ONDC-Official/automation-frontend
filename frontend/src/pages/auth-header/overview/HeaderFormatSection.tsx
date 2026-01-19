import { FC } from "react";
import { FaFileCode } from "react-icons/fa";
import { SIGNING_STRING_FORMAT, AUTH_HEADER_FORMAT } from "@pages/auth-header/overview/data";

const HeaderFormatSection: FC = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FaFileCode className="text-indigo-600 text-xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Header Format</h3>
        </div>

        <div className="space-y-4">
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Signing String Structure:</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono">{SIGNING_STRING_FORMAT}</pre>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Authorization Header Format:</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                        {AUTH_HEADER_FORMAT}
                    </pre>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Key Parameters:</h4>
                <ul className="text-sm text-blue-900 space-y-1">
                    <li>
                        <strong>keyId:</strong> Format is "subscriber_id|unique_key_id|ed25519"
                    </li>
                    <li>
                        <strong>created/expires:</strong> Unix timestamps for validity window
                    </li>
                    <li>
                        <strong>ttl:</strong> Typically 3600 seconds (1 hour)
                    </li>
                    <li>
                        <strong>signature:</strong> Base64-encoded Ed25519 signature
                    </li>
                </ul>
            </div>
        </div>
    </div>
);

export default HeaderFormatSection;
