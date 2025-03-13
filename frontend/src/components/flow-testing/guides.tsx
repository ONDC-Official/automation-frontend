export function FormGuide() {
  return (
    <div className="w-full bg-gray-50 border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Guide</h3>

      <p className="text-gray-600 mb-4">
        The Scenario Testing Tool enabling testing of complete ONDC workflows
        across buyer and seller interactions across various use cases and
        features as applicable in the respective domain. Enter your details to
        get started with the testing. Once entered, based on the use case
        selected, flows specific to the domain/ use case will be available to
        initiate the flow testing process. Process & Send payloads are per the
        flow and issues, if any, are highlighted as you proceed step by step.
      </p>
      <p className="text-gray-600">To test your app, send requests to:</p>
      <ul className="list-disc pl-6 mt-2 text-gray-600 space-y-2">
        <li>
          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {import.meta.env.VITE_BAP_URL}
          </code>{" "}
          for Buyer testing.
        </li>
        <li>
          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {import.meta.env.VITE_BPP_URL}
          </code>{" "}
          for Seller testing.
        </li>
      </ul>
    </div>
  );
}
