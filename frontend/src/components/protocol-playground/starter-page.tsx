import { useContext, useState } from "react";
import { PlaygroundContext } from "./context/playground-context";

import PlaygroundPage from "./playground-page";
import { createInitialMockConfig } from "@ondc/automation-mock-runner";

export default function GetPlaygroundComponent() {
	const { config, setCurrentConfig } = useContext(PlaygroundContext);
	const [domain, setDomain] = useState("");
	const [version, setVersion] = useState("");
	const [flowId, setFlowId] = useState("");
	if (config) {
		return <PlaygroundPage />;
	}

	function SetConfig(domain: string, version: string, flowId: string) {
		if (domain && version && flowId) {
			setCurrentConfig(createInitialMockConfig(domain, version, flowId));
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
			{/* Animated background circles */}
			<div className="absolute top-20 left-10 w-48 h-48 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
			<div className="absolute top-32 right-20 w-56 h-56 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>

			{/* Main content card */}
			<div className="relative z-10 max-w-md w-full">
				{/* Floating header */}
				<div className="text-center mb-6">
					<h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent animate-gradient">
						ONDC Protocol
					</h1>
					<h2 className="text-2xl font-bold text-sky-900 mb-1">Playground</h2>
					<p className="text-sm text-sky-600 font-light">
						Craft your journey through protocols
					</p>
				</div>

				{/* Glass morphism card */}
				<div className="backdrop-blur-xl bg-white bg-opacity-70 rounded-2xl shadow-xl p-6 border border-white border-opacity-50">
					<div className="mb-5 text-center">
						<h3 className="text-lg font-semibold text-sky-800 mb-2">
							Initialize Your Flow
						</h3>
						<div className="w-16 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500 mx-auto rounded-full"></div>
					</div>

					<div className="space-y-4">
						{/* Domain input */}
						<div>
							<label className="block text-xs font-semibold text-sky-700 mb-1.5 uppercase tracking-wider">
								Domain
							</label>
							<input
								type="text"
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
								placeholder="mobility, logistics, retail..."
								className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all duration-300 text-sky-900 placeholder-sky-400 text-sm"
							/>
						</div>

						{/* Version input */}
						<div>
							<label className="block text-xs font-semibold text-sky-700 mb-1.5 uppercase tracking-wider">
								Version
							</label>
							<input
								type="text"
								value={version}
								onChange={(e) => setVersion(e.target.value)}
								placeholder="2.0.1, 1.5.3, 3.0.0..."
								className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all duration-300 text-sky-900 placeholder-sky-400 text-sm"
							/>
						</div>

						{/* Flow ID input */}
						<div>
							<label className="block text-xs font-semibold text-sky-700 mb-1.5 uppercase tracking-wider">
								Flow ID
							</label>
							<input
								type="text"
								value={flowId}
								onChange={(e) => setFlowId(e.target.value)}
								placeholder="Unique identifier for your flow"
								className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all duration-300 text-sky-900 placeholder-sky-400 text-sm"
							/>
						</div>

						{/* Launch button */}
						<button
							onClick={() => SetConfig(domain, version, flowId)}
							className="w-full mt-4 relative group overflow-hidden"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 rounded-xl"></div>
							<div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							<span className="relative block px-6 py-3 text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2">
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/>
								</svg>
								Continue to playground
							</span>
						</button>
					</div>

					{/* Quick suggestions */}
					{/* <div className="mt-5 pt-4 border-t border-sky-200">
						<p className="text-xs text-sky-600 text-center mb-2 font-medium">
							Quick Start Templates
						</p>
						<div className="flex flex-wrap gap-2 justify-center">
							{[
								{ d: "mobility", v: "2.0.1" },
								{ d: "logistics", v: "1.2.0" },
								{ d: "retail", v: "1.1.0" },
							].map((template, idx) => (
								<button
									key={idx}
									onClick={() => {
										setDomain(template.d);
										setVersion(template.v);
									}}
									className="px-3 py-1.5 bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 rounded-full text-xs font-medium hover:from-sky-200 hover:to-blue-200 transition-all duration-300 border border-sky-200"
								>
									{template.d} {template.v}
								</button>
							))}
						</div>
					</div> */}
				</div>
			</div>

			<style>{`
				@keyframes gradient {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}
				.animate-gradient {
					background-size: 200% 200%;
					animation: gradient 3s ease infinite;
				}
				.delay-700 {
					animation-delay: 700ms;
				}
			`}</style>
		</div>
	);
}
