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
				className={`bg-white rounded-lg shadow-lg p-4 w-auto max-w-[300vw] max-h-[90vh] relative transition-transform duration-300 transform overflow-hidden ${
					isOpen ? "scale-100" : "scale-95"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{onClose && (
					<button
						className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
						onClick={onClose}
					>
						&times;
					</button>
				)}
				<div className="max-h-[calc(90vh-2rem)] overflow-y-auto overflow-x-hidden pr-2">
					{children}
				</div>
			</div>
		</div>,
		document.body
	);
}
