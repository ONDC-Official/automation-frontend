import { FC } from "react";
import { ONDC_ACTION_LIST } from "@/pages/protocol-playground/types";
import { FetchFormProps } from "@pages/db-back-office/types";

const FetchForm: FC<FetchFormProps> = ({
    fetchParams,
    isLoading,
    onFetchParamsChange,
    onFetch,
}) => (
    <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Fetch Payload Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain *</label>
                <input
                    type="text"
                    value={fetchParams.domain}
                    onChange={(e) =>
                        onFetchParamsChange({ ...fetchParams, domain: e.target.value })
                    }
                    className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="e.g., mobility"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Version *</label>
                <input
                    type="text"
                    value={fetchParams.version}
                    onChange={(e) =>
                        onFetchParamsChange({ ...fetchParams, version: e.target.value })
                    }
                    className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="e.g., 2.0.1"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page (Optional)
                </label>
                <input
                    type="text"
                    value={fetchParams.page}
                    onChange={(e) => onFetchParamsChange({ ...fetchParams, page: e.target.value })}
                    className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="e.g., search"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                    value={fetchParams.action}
                    onChange={(e) =>
                        onFetchParamsChange({ ...fetchParams, action: e.target.value })
                    }
                    className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                    {["any", ...ONDC_ACTION_LIST].map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-end">
                <button
                    onClick={onFetch}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:from-sky-600 hover:to-blue-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Fetching...
                        </span>
                    ) : (
                        "Fetch Data"
                    )}
                </button>
            </div>
        </div>
    </div>
);

export default FetchForm;
