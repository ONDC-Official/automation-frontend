import React from "react";
import "../../styles/bubble.css";
const Hero: React.FC = () => {
	return (
		<section className="relative h-60 rounded-md flex flex-col justify-center items-center py-6 px-4 bg-gradient-to-r from-sky-900 via-sky-700 to-sky-600 text-white animate-gradient-bg overflow-hidden">
			{/* Enhanced Moving Background Circles */}
			<div className="absolute inset-0 pointer-events-none grid grid-cols-6 gap-2">
				{[...Array(30)].map((_, index) => (
					<div
						key={index}
						className={`absolute  bg-gray-300 opacity-20 rounded-full h-${
							4 + (index % 3) * 2
						} w-${4 + (index % 3) * 2} animate-bounce-fast`}
						style={{
							top: `${Math.random() * 100}%`,
							left: `${Math.random() * 100}%`,
							animationDuration: `${1 + Math.random() * 2}s`, // Faster animation duration
						}}
					></div>
				))}
			</div>

			{/* Content */}
			<h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-center leading-tight font-poppins">
				ONDC Integration, Simplified!
			</h3>
			<p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-center leading-tight font-poppins">
				Validate, Debug, Deploy
			</p>
			<p className="text-base sm:text-lg mb-6 text-center max-w-xl font-roboto">
				Your all-in-one toolkit for seamless ONDC integration. From schema
				validations to testing full flows, get ONDC-ready quicker!
			</p>
		</section>
	);
};

export default Hero;
