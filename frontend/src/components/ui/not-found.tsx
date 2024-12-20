import React from "react";

const NotFoundPage: React.FC = () => {
	return (
		<div className="flex items-center justify-center min-h-screen w-full">
			<div className="text-center">
				<h1 className="text-9xl font-bold text-sky-600">404</h1>
				<h2 className="text-2xl md:text-4xl font-semibold text-gray-800 mt-4">
					Page Not Found
				</h2>
				<p className="text-gray-600 mt-2">
					Sorry, the page you're looking for doesn't exist or has been moved.
				</p>
				<div className="mt-6">
					<a
						href="/"
						className="inline-block px-6 py-3 text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg shadow-md transition duration-300"
					>
						Go Back Home
					</a>
				</div>
			</div>
		</div>
	);
};

export default NotFoundPage;
