import React, { useEffect, useRef, useState, useCallback } from "react";

// A helper to get a unique ID for the current browser tab.
// It uses sessionStorage to ensure the ID is stable across reloads for this tab only.
const getTabId = () => {
	let tabId = sessionStorage.getItem("componentTabId");
	if (!tabId) {
		tabId = Math.random().toString(36).substring(2, 11);
		sessionStorage.setItem("componentTabId", tabId);
	}
	return tabId;
};

interface Props {
	strokeWidth?: number;
	sqSize?: number;
	duration?: number; // in seconds
	onComplete: () => Promise<void>;
	loop: boolean;
	id: string; // ID is still needed as the base for the unique key
	isActive?: boolean;
}

const CircularProgress: React.FC<Props> = ({
	strokeWidth = 10,
	sqSize = 120,
	duration = 5,
	onComplete,
	loop,
	id,
	isActive = true,
}) => {
	// --- Create unique storage keys for this specific tab ---
	const tabId = useRef(getTabId());
	const storageKey = `${id}-${tabId.current}`;
	const elapsedKey = `${storageKey}_elapsed`;

	const [progress, setProgress] = useState<number>(() => {
		const storedProgress = Number(localStorage.getItem(storageKey));
		return isNaN(storedProgress) ? 0 : storedProgress;
	});

	const animationRef = useRef<number | null>(null);
	const startTimeRef = useRef<number | null>(null);
	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete; // Keep ref updated without triggering effects

	const handleAnimationEnd = useCallback(() => {
		// Clear storage for this tab's timer
		localStorage.removeItem(storageKey);
		localStorage.removeItem(elapsedKey);

		onCompleteRef.current().finally(() => {
			if (loop && isActive) {
				setProgress(0);
				startTimeRef.current = null;
				animationRef.current = requestAnimationFrame(animate);
			}
		});
	}, [storageKey, elapsedKey, loop, isActive]);

	const animate = useCallback(
		(timestamp: number) => {
			if (!startTimeRef.current) {
				const savedElapsed = Number(localStorage.getItem(elapsedKey)) || 0;
				startTimeRef.current = timestamp - savedElapsed * 1000;
			}

			const elapsed = (timestamp - startTimeRef.current) / 1000;
			const currentProgress = Math.min(elapsed / duration, 1);

			setProgress(currentProgress);

			// Save progress using the tab-specific key
			localStorage.setItem(storageKey, String(currentProgress));
			localStorage.setItem(elapsedKey, String(elapsed));

			if (currentProgress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				handleAnimationEnd();
			}
		},
		[duration, storageKey, elapsedKey, handleAnimationEnd]
	);

	useEffect(() => {
		if (isActive) {
			animationRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			startTimeRef.current = null;
		};
	}, [isActive, animate]);

	const radius = (sqSize - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
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
