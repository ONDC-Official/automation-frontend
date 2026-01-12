import { availableDomains } from "@/constants/common";

const SchemaGuide = () => (
  <div className="w-full h-full flex flex-col bg-white border border-sky-100 shadow-sm">
    <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100">
      <h3 className="text-xl font-bold text-gray-900">How to use</h3>
      {/* <p className="text-sm text-sky-700 mt-1">How to use</p> */}
    </div>

    <div className="flex-1 p-6 space-y-6 overflow-y-auto overflow-x-auto custom-scrollbar min-w-0">
      {/* Step 1: Available Domains */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sky-700 text-sm font-bold">1</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-700 font-medium mb-2">
              Workbench is Currently available for the following domains (others coming soon):
            </p>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded space-y-1 text-sm">
              <p className="text-gray-700">
                {availableDomains.map((domain, index) => (
                  <span key={domain.code}>
                    <span className="font-semibold">{domain.code}</span> (Version: {domain.version})
                    {index < availableDomains.length - 1 && " / "}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Paste/Upload Payload */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sky-700 text-sm font-bold">2</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-700 mb-3">
              Paste/Upload Your API Payload. For Example: For search payload validation, paste the
              JSON
            </p>
            {/* <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
                <code className="block min-w-max">{`{
  "context": {
    "domain": "ONDC:RET10",
    "action": "search",
    "country": "IND",
    "city": "std:080",
    "core_version": "1.2.5",
    "bap_id": "bnp.com",
    "bap_uri": "https://bnp.com/ondc",
    "transaction_id": "T1",
    "message_id": "M1",
    "timestamp": "2025-01-08T08:00:00.000Z",
    "ttl": "PT30S"
  },
  "message": {
    "intent": {
      "fulfillment": {
        "type": "Delivery"
      },
      "payment": {
        "@ondc/org/buyer_app_finder_fee_type": "percent",
        "@ondc/org/buyer_app_finder_fee_amount": "3.54"
      },
      "tags": [
        {
          "code": "bap_terms",
          "list": [
            {
              "code": "static_terms",
              "value": ""
            },
            {
              "code": "static_terms_new",
              "value": "https://github.com/ONDC-Official/NP-Static-Terms/buyerNP_BNP/1.0/tc.pdf"
            },
            {
              "code": "effective_date",
              "value": "2025-02-01T00:00:00.000Z"
            }
          ]
        },
        {
          "code": "bap_features",
          "list": [
            {
              "code": "003",
              "value": "yes"
            },
            {
              "code": "005",
              "value": "yes"
            },
            {
              "code": "006",
              "value": "yes"
            }
          ]
        }
      ]
    }
  }
}`}</code>
              </pre> */}
          </div>
        </div>
      </div>

      {/* Step 3: Domain and Version */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sky-700 text-sm font-bold">3</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-700">
              The tool takes the domain and the version for testing compliance. Please ensure domain
              and version are as per <span className="font-semibold text-sky-700">#1</span>
            </p>
          </div>
        </div>
      </div>

      {/* Step 4: Click Validate */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sky-700 text-sm font-bold">4</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-700">
              Click <span className="font-semibold">"Validate"</span> to check for errors in API
              schema, data types, required fields and enums
            </p>
          </div>
        </div>
      </div>

      {/* Step 5: Error Display */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sky-700 text-sm font-bold">5</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-700 mb-3">
              If there are any errors in the payload, it would display errors like:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-red-500"></div>
                  <span className="text-sm text-red-700 font-medium">Validation errors found</span>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">PAYMENT_REQUIRED_TYPE</h4>
                  <ul className="list-disc pl-6 text-gray-700">
                    <li>
                      <code className="bg-red-100 text-red-800 px-2 py-1 text-xs font-mono border border-red-200">
                        $.message.intent.payment['@ondc/org/buyer_app_finder_fee_type']
                      </code>{" "}
                      must be present in the payload
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">PAYMENT_REQUIRED_AMOUNT</h4>
                  <ul className="list-disc pl-6 text-gray-700">
                    <li>
                      <code className="bg-red-100 text-red-800 px-2 py-1 text-xs font-mono border border-red-200">
                        $.message.intent.payment['@ondc/org/buyer_app_finder_fee_amount']
                      </code>{" "}
                      must be present in the payload
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 6: Resolve Errors */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sky-700 text-sm font-bold">6</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-700">
              Resolve the errors given in step{" "}
              <span className="font-semibold text-sky-700">#5</span> and redo from step{" "}
              <span className="font-semibold text-sky-700">#2</span>
            </p>
          </div>
        </div>
      </div>

      {/* Step 7: Success Display */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sky-700 text-sm font-bold">7</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-700 mb-3">
              If there are no errors, it would display like this:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-500"></div>
                <span className="text-sm text-green-700 font-medium">Schema is valid</span>
              </div>
              <p className="text-gray-800 font-semibold">Schema validations passed!</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      {`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #0ea5e9 #e2e8f0;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #0ea5e9, #0284c7);
            border-radius: 4px;
            transition: background 0.2s;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #0284c7, #0369a1);
          }
        `}
    </style>
  </div>
);

export default SchemaGuide;
