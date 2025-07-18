const UserIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="32"
		height="32"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
		<circle cx="12" cy="7" r="4"></circle>
	</svg>
);

// SVG Icon for GitHub
const GitHubIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
	</svg>
);

// The main login card component
const GitHubLogin = () => {
	const handleLogin = () => {
		window.location.href = "http://localhost:4000/auth/github";
	};
	return (
		<div className="font-sans flex items-center justify-center min-h-screen p-4">
			<div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 max-w-md w-full text-center">
				{/* Icon */}
				<div className="flex justify-center mb-6">
					<div className="bg-sky-600 text-white rounded-xl p-3">
						<UserIcon />
					</div>
				</div>

				{/* Heading */}
				<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
					Welcome to Protocol Workbench
				</h1>

				{/* Subheading */}
				<p className="text-slate-500 mb-8">
					Connect your GitHub account to get started quickly
				</p>

				{/* Buttons */}
				<div className="space-y-4">
					<button
						onClick={handleLogin}
						className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
					>
						<GitHubIcon />
						<span className="ml-3">Continue with GitHub</span>
					</button>
					<button
						onClick={() => window.open("https://github.com/", "_blank")}
						className="w-full bg-white text-slate-600 font-semibold py-3 rounded-lg border border-slate-300 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
					>
						Don't have GitHub?
					</button>
				</div>
			</div>
		</div>
	);
};

export default GitHubLogin;
