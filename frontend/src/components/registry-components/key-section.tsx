// src/components/KeysSection.tsx
import React, { useState, useRef, useEffect } from "react";
import type { Key } from "./registry-types";
import DownloadKeysButton from "./download-keys-button";

interface KeysSectionProps {
	keys: Key[];
	onAddKey: (key: Key) => Promise<void>;
	onDeleteKey: (uk_id: string) => Promise<void>;
	setGuideStep: (step: number) => void;
	guideStep: number;
}

export const TrashIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		className="h-5 w-5"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		strokeWidth={2}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
		/>
	</svg>
);

export const KeysSection: React.FC<KeysSectionProps> = ({
	keys,
	onAddKey,
	onDeleteKey,
	setGuideStep, 
	guideStep
}) => {
	const [newKey, setNewKey] = useState<Key>({
		uk_id: "",
		signing_pub: "",
		encryption_pub: "",
	});
	const [isAdding, setIsAdding] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null); 
	const ukidRef = useRef<HTMLDivElement>(null); 
	const generateKeyRef = useRef<HTMLDivElement>(null); 
	const addKeyRef = useRef<HTMLDivElement>(null); 

	useEffect(() => {
        if (guideStep === 2 && containerRef.current) {
            containerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
		if (guideStep === 3 && ukidRef.current) {
            ukidRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
		if (guideStep === 4 && generateKeyRef.current) {
            generateKeyRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
		if (guideStep === 5 && addKeyRef.current) {
            addKeyRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [guideStep]);

	const handleAdd = async () => {
		if (!newKey.uk_id || !newKey.signing_pub) return;
		await onAddKey(newKey);
		setNewKey({ uk_id: "", signing_pub: "", encryption_pub: "" }); // Reset form
		setIsAdding(false);
	};

	const inputClasses =
		"mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
	const labelClasses = "block text-sm font-medium text-gray-700";

	return (
		<div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
			<h2 className="text-xl font-bold text-gray-900">
				Signing & Encryption Keys
			</h2>
			<p className="mt-1 text-sm text-gray-600">
				Manage public keys for your application.
			</p>

			{/* Add New Key Form */}
			<div className="mt-6">
				{isAdding ? (
					<div className="p-4 border rounded-lg bg-gray-50 space-y-4">
						<h3 className="font-medium">Add New Key</h3>
						<div ref={ukidRef} className={`relative ${guideStep === 3 ? "z-50" : ""}`}>
							<label className={labelClasses}>UK ID</label>
							<input
								type="text"
								placeholder="unique-key-id"
								className={inputClasses}
								value={newKey.uk_id}
								onChange={(e) =>
									setNewKey({ ...newKey, uk_id: e.target.value })
								}
							/>
							{guideStep === 3 && (
							<div className="absolute top-16 left-0 bg-white shadow-lg border rounded-lg p-3 w-64 z-50">
								<p className="text-gray-700 font-medium">
								Step 2(a): Add ukid
								</p>
								<div className="flex justify-end mt-2 space-x-2">
								<button
									className="text-sm px-3 py-1 rounded bg-sky-500 text-white hover:bg-sky-600"
									onClick={() => {
									if (guideStep !== 0) {
										setGuideStep(4);
									}
									}}
								>
									Go
								</button>
								</div>
							</div>
							)}
						</div>
						<div>
							<label className={labelClasses}>Signing Public Key</label>
							<textarea
								className={inputClasses}
								value={newKey.signing_pub}
								onChange={(e) =>
									setNewKey({ ...newKey, signing_pub: e.target.value })
								}
							/>
						</div>
						<div>
							<label className={labelClasses}>Encryption Public Key</label>
							<textarea
								className={inputClasses}
								value={newKey.encryption_pub}
								onChange={(e) =>
									setNewKey({ ...newKey, encryption_pub: e.target.value })
								}
							/>
						</div>
						<div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
							<div className="flex-1">
								<label className={labelClasses}>Valid From</label>
								<input
									type="text"
									placeholder="unique-key-id"
									className="cursor-not-allowed mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
									value={new Date().toISOString()}
									disabled
								/>
							</div>
							<div className="flex-1">
								<label className={labelClasses}>Valid Till</label>
								<input
									type="text"
									placeholder="unique-key-id"
									className="cursor-not-allowed mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
									value={new Date(
										new Date().setFullYear(new Date().getFullYear() + 1)
									).toISOString()}
									disabled
								/>
							</div>
						</div>
						<div className="flex justify-end space-x-3">
							<button
								onClick={() => setIsAdding(false)}
								className="text-sm font-medium text-gray-600"
							>
								Cancel
							</button>
							<div ref={generateKeyRef} className={`relative ${guideStep === 5 ? "z-50" : ""}`}>
								<button
									onClick={handleAdd}
									className="px-4 py-1.5 text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
								>
									Add Key
								</button>
								{guideStep === 5 && (
								<div className="absolute top-12 left-0 bg-white shadow-lg border rounded-lg p-3 w-64 z-50">
									<p className="text-gray-700 font-medium">
									Step 2(c): Save Keys
									</p>
									<div className="flex justify-end mt-2 space-x-2">
									<button
										className="text-sm px-3 py-1 rounded bg-sky-500 text-white hover:bg-sky-600"
										onClick={() => {
										if (guideStep !== 0) {
											setGuideStep(6);
										}
										}}
									>
										Go
									</button>
									</div>
								</div>
								)}
							</div>
							<div ref={generateKeyRef} className={`relative ${guideStep === 4 ? "z-50" : ""}`}>
								<DownloadKeysButton
									onDownload={async (p, e) => {
										setNewKey({ ...newKey, signing_pub: p, encryption_pub: e });
									}}
								/>
								{guideStep === 4 && (
								<div className="absolute top-12 left-0 bg-white shadow-lg border rounded-lg p-3 w-64 z-50">
									<p className="text-gray-700 font-medium">
									Step 2(b): Generate Keys
									</p>
									<div className="flex justify-end mt-2 space-x-2">
									<button
										className="text-sm px-3 py-1 rounded bg-sky-500 text-white hover:bg-sky-600"
										onClick={() => {
										if (guideStep !== 0) {
											setGuideStep(5);
										}
										}}
									>
										Go
									</button>
									</div>
								</div>
								)}
							</div>
						</div>
					</div>
				) : (
					<div  ref={containerRef} className={`relative flex gap-2 ${guideStep === 2 ? "z-50" : ""}`}>
						<button
							onClick={() => {
								setIsAdding(true)
								if(guideStep !== 0) {
									setGuideStep(3)
								}
							}}
							className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
						>
							+ Add Key
						</button>

						{guideStep === 2 && (
							 <div className="absolute top-10 left-0 bg-white shadow-lg border rounded-lg p-3 w-64 z-50">
							 <p className="text-gray-700 font-medium">
							   Step 2: Add signing keys
							 </p>
							 <div className="flex justify-end mt-2 space-x-2">
							   <button
								 className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
								 onClick={() => setGuideStep(6)}
							   >
								 Next
							   </button>
							    <button
									className="text-sm px-3 py-1 rounded bg-sky-500 text-white hover:bg-sky-600"
									onClick={() => {
										setIsAdding(true)
										if(guideStep !== 0) {
											setGuideStep(3)
										}
									}}
									>
									Go
								</button>
							 </div>
						   </div>
						)}
					</div>
				)}
			</div>

			{/* Keys List */}
			<div className="mt-4 space-y-3">
				{keys.map((key) => (
					<div
						key={key.uk_id}
						className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
					>
						{/* <span className="font-mono text-sm text-gray-800">{key.uk_id}</span> */}
						<details className="w-full group transition-all duration-200">
							<summary className="cursor-pointer flex items-center justify-between px-2 py-2 rounded hover:bg-gray-50 transition-colors duration-150">
								<span className="font-mono text-sm text-gray-800">
									UkId: {key.uk_id}
								</span>
								<div className="flex items-center space-x-2">
									<svg
										className="w-4 h-4 ml-2 text-gray-400 group-open:rotate-180 transition-transform duration-200"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
									<button
										onClick={() => onDeleteKey(key.uk_id)}
										className="text-gray-400 hover:text-red-600"
									>
										<TrashIcon />
									</button>
								</div>
							</summary>
							<div className="pl-2 pr-2 pb-2 pt-1 animate-fade-in">
								<span className="block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
									Public Signing Key
								</span>
								<textarea
									className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md shadow-sm text-sm text-gray-800"
									value={key.signing_pub}
									readOnly
								/>
								<span className="block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-2">
									Public Encryption Key
								</span>
								<textarea
									className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md shadow-sm text-sm text-gray-800"
									value={key.encryption_pub}
									readOnly
								/>
							</div>
						</details>
					</div>
				))}
			</div>
		</div>
	);
};
