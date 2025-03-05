export function FormGuide() {
	return (
		<div className="w-full bg-gray-50 border border-gray-200 p-6">
			<h3 className="text-xl font-semibold text-gray-800 mb-4">Guide</h3>
			<p className="text-gray-600 mb-4">
				Please fill in the details to get started with the flow testing.
			</p>
			<p className="text-gray-600">To test your app, send requests to:</p>
			<ul className="list-disc pl-6 mt-2 text-gray-600 space-y-2">
				<li>
					<code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
						https://dev-automation.ondc.org/seller
					</code>{" "}
					for Buyer testing.
				</li>
				<li>
					<code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
						https://dev-automation.ondc.org/buyer
					</code>{" "}
					for Seller testing.
				</li>
			</ul>
		</div>
	);
}
