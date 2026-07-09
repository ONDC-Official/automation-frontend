import { FC } from "react";
import { ONDC_ACTION_LIST } from "@/pages/protocol-playground/types";
import { FetchFormProps } from "@pages/db-back-office/types";
import LoadingButton from "@/components/Forms/loading-button";
import { Input } from "@/components/Shadcn/TextField/input";

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
                <Input
                    type="text"
                    value={fetchParams.domain}
                    onChange={(e) =>
                        onFetchParamsChange({ ...fetchParams, domain: e.target.value })
                    }
                    className="bg-white w-full border-sky-200 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500"
                    placeholder="e.g., mobility"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Version *</label>
                <Input
                    type="text"
                    value={fetchParams.version}
                    onChange={(e) =>
                        onFetchParamsChange({ ...fetchParams, version: e.target.value })
                    }
                    className="bg-white w-full border-sky-200 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500"
                    placeholder="e.g., 2.0.1"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page (Optional)
                </label>
                <Input
                    type="text"
                    value={fetchParams.page}
                    onChange={(e) => onFetchParamsChange({ ...fetchParams, page: e.target.value })}
                    className="bg-white w-full border-sky-200 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500"
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
                <LoadingButton
                    type="button"
                    buttonText="Fetch Data"
                    isLoading={isLoading}
                    onClick={onFetch}
                    loadingText="Fetching..."
                    className="w-full bg-linear-to-r from-sky-500 to-blue-500 py-2 px-4 rounded-lg font-medium hover:from-sky-600 hover:to-blue-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
        </div>
    </div>
);

export default FetchForm;
