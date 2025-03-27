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
      <p className="text-gray-600 mb-4">
        To test your app, use the appropriate endpoint based on your role:
      </p>
      <ul className="list-disc pl-6 mt-2 text-gray-600 space-y-2">
        <li>
          <p className="text-gray-600 mb-4">
            <b>If you are a Seller NP:</b> The protocol workbench will act as a
            buyer network participant. Use this URL:
          </p>
          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {`${import.meta.env.VITE_BASE_URL}/<domain>/<version>/buyer`}
          </code>
        </li>
        <li>
          <p className="text-gray-600 mb-4">
            <b>If you are a Buyer NP:</b> The protocol workbench will act as a
            seller network participant. Use this URL:
          </p>
          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {`${import.meta.env.VITE_BASE_URL}/<domain>/<version>/seller`}
          </code>{" "}
        </li>
      </ul>
      <p className="text-gray-600 mb-6 mt-6">
        <b>Example</b>
      </p>
      <p className="text-gray-600 mb-4">
        If the domain is <b>ONDC:TRV11</b> and the version is <b>2.0.0</b>, the
        request URLs will be:
      </p>
      <ul className="list-disc pl-6 mt-2 text-gray-600 space-y-2">
        <li>
          <p className="text-gray-600 mb-4">
            Protocol workbench endpoint (acting as a buyer network participant):
          </p>
          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {`${import.meta.env.VITE_BASE_URL}/ONDC:TRV11/2.0.0/buyer`}
          </code>
        </li>
        <li>
          <p className="text-gray-600 mb-4">
            Protocol workbench endpoint (acting as a seller network
            participant):
          </p>
          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {`${import.meta.env.VITE_BASE_URL}/ONDC:TRV11/2.0.0/seller`}
          </code>{" "}
        </li>
      </ul>
    </div>
  );
}
