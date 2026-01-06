export function FormGuide() {
	return (
		<div className="w-full bg-gray-50 border border-gray-200 p-6 overflow-y-auto">
			<h3 className="text-xl font-semibold text-gray-800 mb-4">
				Scenario Testing
			</h3>

			{/* Introduction */}
			<p className="text-gray-600 mb-6 leading-relaxed">
				The Scenario Testing Tool is designed to facilitate end-to-end
				validation of ONDC (Open Network for Digital Commerce) workflows by
				simulating complete buyer-side and seller-side interactions. It enables
				testers, integrators, and network participants to execute comprehensive
				test scenarios that mirror real-world use cases across multiple domains
				such as retail, mobility, logistics, services, and more.
			</p>

			<p className="text-gray-600 mb-4 leading-relaxed">
				Enter your details to get started with the testing as given in below
				image:
			</p>

			{/* Image 1 - Form Input Image */}
			<div className="mb-6 border border-gray-300 rounded overflow-hidden">
				<img
					src={`/images/scenario-test.png`}
					alt="Scenario Testing Form"
					className="w-full h-auto"
				/>
			</div>

			{/* Step-by-step Guide */}
			<div className="space-y-5 mb-6">
				{/* Step 1 */}
				<div className="space-y-2">
					<StepHeader step={1} title="Enter Subscriber URL:" />
					<p className="text-gray-600 pl-10">
						Enter correct Subscriber URL where you will receive requests
					</p>
				</div>


				{/* Step 2 */}
				<div className="space-y-2">
					<StepHeader step={2} title="Select Domain:" />
					<p className="text-gray-600 pl-10">
						Select Domain for which you want to test. For example: If you want
						to test Retail F&B select <b>ONDC:RET11</b>
					</p>
					<p className="text-gray-600 pl-7">
						Select Domain for which you want to test. For example: If you want
						to test Retail F&B select <b>ONDC:RET11</b>
					</p>
				</div>

				{/* Step 3 */}
				<div className="space-y-2">
					<StepHeader step={3} title="Select Version:" />
					<p className="text-gray-600 pl-10">
						Based on Domain it will display Version. Select the version for
						which you want to test. For Example: For Retail F&B{" "}
						<b>ONDC:RET11</b> it displays <b>1.2.5</b>
					</p>
				</div>

				{/* Step 4 */}
				<div className="space-y-2">
					<StepHeader step={4} title="Select Usecase:" />
					<p className="text-gray-600 pl-10">
						Based on Domain and Version it displays a list of use cases. For
						Example: For Domain <b>ONDC:RET11</b> Version <b>1.2.5</b> it
						displays <b>F&B</b>
					</p>
				</div>

				{/* Step 5 */}
				<div className="space-y-2">
					<StepHeader step={5} title="Select App Type:" />
					<p className="text-gray-600 pl-10">
						If you are testing as Buyer NP then Select app Type as <b>BAP</b>{" "}
						and If you are testing as Seller NP then Select app Type as{" "}
						<b>BPP</b>
					</p>
				</div>

				{/* Important Notes */}
				<div className="space-y-3">
					<p className="text-gray-700 font-semibold text-sm">NOTE:</p>

					{/* Note #1 */}
					<div className="space-y-2">
						<p className="text-gray-700 text-sm">
							<span className="font-semibold">#1</span> If you are Buyer NP then
							workbench would act as Seller NP and you would receive requests
							from URL
						</p>
						<code className="block bg-white text-gray-800 px-3 py-2 rounded text-sm border border-blue-300">
							{`${import.meta.env.VITE_BASE_URL}`}/&lt;domain&gt;/&lt;version&gt;/seller
						</code>
						<p className="text-gray-700 text-sm pl-4">
							For Example: For RET11 Version 1.2.5 it would be
						</p>
						<code className="block bg-white text-gray-700 px-3 py-2 rounded text-sm border border-blue-300">
							{`${import.meta.env.VITE_BASE_URL}`}/ONDC:RET11/1.2.5/seller
						</code>
					</div>

					{/* Note #2 */}
					<div className="space-y-2">
						<p className="text-gray-700 text-sm">
							<span className="font-semibold">#2</span> If you are Seller NP
							then workbench would act as Buyer NP and you would receive
							requests from URL
						</p>
						<code className="block bg-white text-gray-800 px-3 py-2 rounded text-sm border border-blue-300">
							{`${import.meta.env.VITE_BASE_URL}`}/&lt;domain&gt;/&lt;version&gt;/buyer
						</code>
						<p className="text-gray-700 text-sm pl-4">
							For Example: For RET11 Version 1.2.5 it would be
						</p>
						<code className="block bg-white text-gray-700 px-3 py-2 rounded text-sm border border-blue-300">
							{`${import.meta.env.VITE_BASE_URL}`}/ONDC:RET11/1.2.5/buyer
						</code>
					</div>
				</div>

				{/* Step 6 */}
				<div className="space-y-2">
					<StepHeader step={6} title="Select Environment:" />
					<p className="text-gray-600 pl-10">
						Select the environment for which you want to test <b>STAGING</b> OR{" "}
						<b>PRE-PRODUCTION</b>
					</p>
				</div>
			</div>

			{/* Submit Instructions */}
			<div className="mb-6">
				<p className="text-gray-700 font-medium">
					After filling form click <b>Submit</b>
				</p>
			</div>

			{/* Flow Description */}
			<p className="text-gray-600 mb-4">It opens page like below image:</p>

			{/* Image 2 - Flow Image */}
			<div className="mb-4 border border-gray-300 rounded overflow-hidden">
				<img
					src={`/images/scenario-flow.png`}
					alt="Scenario Testing Flow"
					className="w-full h-auto"
				/>
			</div>
		</div>
	);
}

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-sky-700 text-sm font-bold">{step}</span>
      </div>
      <h4 className="text-gray-800 font-semibold">{title}</h4>
    </div>
  );
}

export function GetRequestEndpoint(
	domain: string,
	version: string,
	npType: string
) {
	if (npType === "BAP") {
		return `${import.meta.env.VITE_BASE_URL}/${domain}/${version}/seller`;
	} else if (npType === "BPP") {
		return `${import.meta.env.VITE_BASE_URL}/${domain}/${version}/buyer`;
	}
	return "<BUYER or SELLER>";
}
