const Loader = () => {
	return (
		<div className="flex items-center justify-center w-full h-full">
			<div className="relative w-16 h-16">
				{/* Outer Circle */}
				<div className="absolute inset-0 rounded-full border-4 border-sky-300 border-t-sky-500 animate-spin"></div>
				{/* Inner Circle */}
				{/* <div className="absolute inset-4 rounded-full bg-gradient-to-b from-white to-sky-100"></div> */}
			</div>
		</div>
	);
};

export default Loader;
