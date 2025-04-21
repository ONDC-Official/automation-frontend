// // import React, { useEffect, useRef, useState } from "react";

// // interface Props {
// // 	strokeWidth?: number;
// // 	sqSize?: number;
// // 	duration?: number; // in seconds
// // 	onComplete: () => Promise<void>;
// // 	loop: boolean;
// // 	isActive?: boolean;
// // }

// // const CircularProgress: React.FC<Props> = ({
// // 	strokeWidth = 10,
// // 	sqSize = 120,
// // 	duration = 5,
// // 	onComplete,
// // 	loop,
// // 	isActive = true,
// // }) => {
// // 	const radius = (sqSize - strokeWidth) / 2;
// // 	const circumference = 2 * Math.PI * radius;

// // 	const savedProgress = useRef(0);
// // 	const [progress, setProgress] = useState(savedProgress.current);

// // 	useEffect(() => {
// // 		if (!isActive) {
// // 			return;
// // 		}
// // 		let start: number | null = null;
// // 		let frameId: number;

// // 		const animate = (timestamp: number) => {
// // 			if (!start) start = timestamp;
// // 			const elapsed = (timestamp - start) / 1000;
// // 			const progress = Math.min(elapsed / duration, 1);
// // 			setProgress(progress);
// // 			savedProgress.current = progress;
// // 			if (progress < 1) {
// // 				frameId = requestAnimationFrame(animate);
// // 			} else {
// // 				onComplete().then(() => {
// // 					if (loop) {
// // 						setProgress(0);
// // 						savedProgress.current = 0;
// // 						start = null;
// // 						frameId = requestAnimationFrame(animate);
// // 					}
// // 				});
// // 			}
// // 		};

// // 		frameId = requestAnimationFrame(animate);

// // 		return () => cancelAnimationFrame(frameId);
// // 	}, [duration, loop, onComplete, isActive]);

// // 	const strokeDashoffset = circumference * (1 - progress);
// // 	if (!isActive) return <></>;
// // 	return (
// // 		<div
// // 			className="flex items-center justify-center p-2 ml-2 rounded-md shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
// //         text-sky-600 ease-in"
// // 		>
// // 			<svg width={sqSize} height={sqSize}>
// // 				<circle
// // 					cx={sqSize / 2}
// // 					cy={sqSize / 2}
// // 					r={radius}
// // 					stroke="#e6e6e6"
// // 					fill="none"
// // 					strokeWidth={strokeWidth}
// // 				/>
// // 				<circle
// // 					cx={sqSize / 2}
// // 					cy={sqSize / 2}
// // 					r={radius}
// // 					stroke="#3b82f6"
// // 					fill="none"
// // 					strokeWidth={strokeWidth}
// // 					strokeDasharray={circumference}
// // 					strokeDashoffset={strokeDashoffset}
// // 					strokeLinecap="round"
// // 				/>
// // 			</svg>
// // 		</div>
// // 	);
// // };

// // export default CircularProgress;

// import React, { useEffect, useRef, useState } from "react";

// interface Props {
// 	strokeWidth?: number;
// 	sqSize?: number;
// 	duration?: number; // in seconds
// 	onComplete: () => Promise<void>;
// 	loop: boolean;
// 	id?: string;
// 	isActive?: boolean;
// }

// const CircularProgress: React.FC<Props> = ({
// 	strokeWidth = 10,
// 	sqSize = 120,
// 	duration = 5,
// 	onComplete,
// 	loop,
// 	isActive = true,
// 	id,
// }) => {
// 	const radius = (sqSize - strokeWidth) / 2;
// 	const circumference = 2 * Math.PI * radius;
// 	if (id) console.log("id", id, localStorage.getItem(id || ""));
// 	const [progress, setProgress] = useState(
// 		id ? Number(localStorage.getItem(id)) : 0
// 	);
// 	const animationRef = useRef<number | null>(null);
// 	const startTimeRef = useRef<number | null>(null);
// 	const isMounted = useRef(true);
// 	const isRunning = useRef(false);

// 	useEffect(() => {
// 		isMounted.current = true;

// 		return () => {
// 			isMounted.current = false;
// 			if (animationRef.current) {
// 				cancelAnimationFrame(animationRef.current);
// 			}
// 		};
// 	}, []);

// 	useEffect(() => {
// 		if (!isActive) return;

// 		isRunning.current = true;
// 		startTimeRef.current = null;

// 		const animate = (timestamp: number) => {
// 			if (!isRunning.current || !isMounted.current) return;

// 			if (!startTimeRef.current) startTimeRef.current = timestamp;
// 			const elapsed = (timestamp - startTimeRef.current) / 1000;
// 			const currentProgress = Math.min(elapsed / duration, 1);

// 			setProgress(currentProgress);
// 			if (id) {
// 				localStorage.setItem(id, String(currentProgress));
// 			}

// 			if (currentProgress < 1) {
// 				animationRef.current = requestAnimationFrame(animate);
// 			} else {
// 				isRunning.current = false;

// 				onComplete().then(() => {
// 					if (!isMounted.current) return;

// 					if (loop && isActive) {
// 						// reset and restart
// 						setProgress(0);
// 						if (id) {
// 							localStorage.setItem(id, "0");
// 						}
// 						startTimeRef.current = null;
// 						isRunning.current = true;
// 						animationRef.current = requestAnimationFrame(animate);
// 					}
// 				});
// 			}
// 		};

// 		animationRef.current = requestAnimationFrame(animate);

// 		return () => {
// 			if (animationRef.current) {
// 				cancelAnimationFrame(animationRef.current);
// 			}
// 			isRunning.current = false;
// 		};
// 	}, [duration, loop, onComplete, isActive]);

// 	const strokeDashoffset = circumference * (1 - progress);
// 	if (!isActive) return null;

// 	return (
// 		<div className="flex items-center justify-center p-2 ml-2 rounded-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sky-700 ease-in">
// 			<svg width={sqSize} height={sqSize}>
// 				<circle
// 					cx={sqSize / 2}
// 					cy={sqSize / 2}
// 					r={radius}
// 					stroke="#e6e6e6"
// 					fill="none"
// 					strokeWidth={strokeWidth}
// 				/>
// 				<circle
// 					cx={sqSize / 2}
// 					cy={sqSize / 2}
// 					r={radius}
// 					stroke="#0369a1"
// 					fill="none"
// 					strokeWidth={strokeWidth}
// 					strokeDasharray={circumference}
// 					strokeDashoffset={strokeDashoffset}
// 					strokeLinecap="round"
// 				/>
// 			</svg>
// 		</div>
// 	);
// };

// export default CircularProgress;

import React, { useEffect, useRef, useState } from "react";

interface Props {
	strokeWidth?: number;
	sqSize?: number;
	duration?: number; // in seconds
	onComplete: () => Promise<void>;
	loop: boolean;
	id?: string;
	isActive?: boolean;
}

const CircularProgress: React.FC<Props> = ({
	strokeWidth = 10,
	sqSize = 120,
	duration = 5,
	onComplete,
	loop,
	isActive = true,
	id,
}) => {
	const radius = (sqSize - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const [progress, setProgress] = useState<number>(() => {
		if (id) {
			const storedProgress = Number(localStorage.getItem(id));
			return isNaN(storedProgress) ? 0 : storedProgress;
		}
		return 0;
	});

	const animationRef = useRef<number | null>(null);
	const startTimeRef = useRef<number | null>(null);
	const isMounted = useRef(true);
	const isRunning = useRef(false);

	useEffect(() => {
		isMounted.current = true;

		return () => {
			isMounted.current = false;
			isRunning.current = false;
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!isActive) return;

		isRunning.current = true;

		const savedElapsed = id
			? Number(localStorage.getItem(`${id}_elapsed`)) || 0
			: 0;

		startTimeRef.current = null;

		const animate = (timestamp: number) => {
			if (!isRunning.current || !isMounted.current) return;

			if (!startTimeRef.current) {
				startTimeRef.current = timestamp - savedElapsed * 1000;
			}

			const elapsed = (timestamp - startTimeRef.current) / 1000;
			const currentProgress = Math.min(elapsed / duration, 1);

			setProgress(currentProgress);

			if (id) {
				localStorage.setItem(id, String(currentProgress));
				localStorage.setItem(`${id}_elapsed`, String(elapsed));
			}

			if (currentProgress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				isRunning.current = false;

				// Clear storage
				if (id) {
					localStorage.removeItem(id);
					localStorage.removeItem(`${id}_elapsed`);
				}

				onComplete().then(() => {
					if (!isMounted.current) return;

					if (loop && isActive) {
						setProgress(0);
						if (id) {
							localStorage.setItem(id, "0");
							localStorage.setItem(`${id}_elapsed`, "0");
						}
						startTimeRef.current = null;
						isRunning.current = true;
						animationRef.current = requestAnimationFrame(animate);
					}
				});
			}
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			isRunning.current = false;
		};
	}, [duration, loop, onComplete, isActive, id]);

	const strokeDashoffset = circumference * (1 - progress);

	if (!isActive) return null;

	return (
		<div className="flex items-center justify-center p-2 ml-2 rounded-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sky-700 ease-in">
			<svg width={sqSize} height={sqSize}>
				<circle
					cx={sqSize / 2}
					cy={sqSize / 2}
					r={radius}
					stroke="#e6e6e6"
					fill="none"
					strokeWidth={strokeWidth}
				/>
				<circle
					cx={sqSize / 2}
					cy={sqSize / 2}
					r={radius}
					stroke="#0369a1"
					fill="none"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
				/>
			</svg>
		</div>
	);
};

export default CircularProgress;
