import React from "react";

const ComingSoonPage: React.FC = () => {
	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-sky-500 to-sky-600 relative overflow-hidden">
			{/* Decorative Background Elements */}
			<div className="absolute top-10 left-10 w-24 h-24 bg-white opacity-10 rounded-full animate-pulse"></div>
			<div className="absolute bottom-10 right-10 w-40 h-40 bg-white opacity-10 rounded-full animate-pulse"></div>

			{/* Main Content */}
			<div className="text-center px-4">
				<h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 animate-pulse">
					Coming Soon
				</h1>
				<p className="text-lg md:text-2xl text-white mb-8">
					We're working hard to bring something amazing to you. Stay tuned!
				</p>
			</div>
		</div>
	);
};

export default ComingSoonPage;
