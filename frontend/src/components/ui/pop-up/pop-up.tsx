import React from "react";
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
	if (!isOpen) return null; // Don't render if not open

	return ReactDOM.createPortal(
		<div
			className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300"
			onClick={onClose}
		>
			<div
				className="bg-white rounded-lg shadow-lg p-4 w-96 relative transition-transform duration-300 transform scale-95"
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
		document.body // Portal renders directly to the <body>
	);
}
