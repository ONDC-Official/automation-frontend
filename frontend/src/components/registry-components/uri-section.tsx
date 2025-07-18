// src/components/URIsSection.tsx
import React from "react";
import type { Uri } from "./registry-types";
import { v4 as uuidv4 } from "uuid"; // Need to install uuid: npm install uuid @types/uuid
import { TrashIcon } from "./key-section";

interface URIsSectionProps {
	uris: Uri[];
	onAddUri: (uri: Uri) => Promise<void>;
	onEditUri: (id: string, newUri: string) => Promise<void>;
	onDeleteUri: (id: string) => Promise<void>;
}

export const URIsSection: React.FC<URIsSectionProps> = ({
	uris,
	onAddUri,
	// onEditUri,
	onDeleteUri,
}) => {
	const handleAdd = () => {
		const newId = uuidv4().slice(0, 8); // Autogenerated ID
		const newUri = prompt("Enter the new URI:");
		if (newUri) {
			onAddUri({ id: newId, uri: newUri });
		}
	};

	// const handleEdit = (id: string, currentUri: string) => {
	// 	const updatedUri = prompt("Edit URI:", currentUri);
	// 	if (updatedUri && updatedUri !== currentUri) {
	// 		onEditUri(id, updatedUri);
	// 	}
	// };

	const handleDelete = (id: string) => {
		if (window.confirm("Are you sure you want to delete this URI?")) {
			onDeleteUri(id);
		}
	};

	return (
		<div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
			<h2 className="text-xl font-bold text-gray-900">URIs</h2>
			<p className="mt-1 text-sm text-gray-600">Manage endpoint URIs.</p>
			<div className="mt-6">
				<button
					onClick={handleAdd}
					className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
				>
					+ Add URI
				</button>
			</div>
			<div className="mt-4 space-y-3">
				{uris.map((uri) => (
					<div
						key={uri.id}
						className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
					>
						<div>
							<span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
								ID: {uri.id}
							</span>
							<span className="ml-4 font-medium text-gray-800">{uri.uri}</span>
						</div>
						<div className="flex gap-2">
							{/* <button
								onClick={() => handleEdit(uri.id, uri.uri)}
								className="text-sm font-medium text-sky-600 hover:text-sky-800"
							>
								Edit
							</button> */}
							<button
								onClick={() => handleDelete(uri.id)}
								className="text-gray-400 hover:text-red-600"
							>
								<TrashIcon />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
