import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

export default function Popup({
	children,
	isOpen,
	onClose,
}: {
	children: React.ReactNode;
	isOpen: boolean;
	onClose?: () => void;
}) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsVisible(true);
		} else {
			// Delay unmounting to allow fade-out animation
			const timer = setTimeout(() => setIsVisible(false), 300);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	// Don't render anything if not visible
	if (!isVisible) return null;

	return ReactDOM.createPortal(
		<div
			className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
				isOpen ? "opacity-100" : "opacity-0"
			}`}
			onClick={onClose}
		>
			<div
				className={`bg-white rounded-lg shadow-lg p-4 w-96 relative transition-transform duration-300 transform ${
					isOpen ? "scale-100" : "scale-95"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{onClose && (
					<button
						className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
						onClick={onClose}
					>
						&times;
					</button>
				)}
				{children}
			</div>
		</div>,
		document.body
	);
}
