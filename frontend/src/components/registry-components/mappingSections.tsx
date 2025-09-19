// src/components/MappingsSection.tsx
import React, { useState, useEffect } from "react";
import type { Mapping } from "./registry-types";
import { v4 as uuidv4 } from "uuid";
import { TrashIcon } from "./key-section";
import axios from "axios";
import GuideOverlay from "../ui/GuideOverlay";
import { useGuide } from "../../context/guideContext";

// Predefined dropdown options
const DOMAIN_OPTIONS = ["ONDC:TRV10", "ONDC:RET10", "ONDC:LOG10"];
const TYPE_OPTIONS = ["BAP", "BPP"];

interface MappingsSectionProps {
	mappings: Mapping[];
	// uris: Uri[];
	// locations: Location[];
	onAddMapping: (mapping: Mapping) => Promise<void>;
	onUpdateMapping: (id: string, mapping: Partial<Mapping>) => Promise<void>;
	onDeleteMapping: (id: string) => Promise<void>;
}

export const MappingsSection: React.FC<MappingsSectionProps> = ({
	mappings,
	// uris,
	// locations,
	onAddMapping,
	onUpdateMapping,
	onDeleteMapping,
}) => {
	const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);
	const [expandedMappingId, setExpandedMappingId] = useState<string | null>(
		null
	);
	const [dynamicList, setDynamicList] = useState({
		domain: [],
		version: [],
		usecase: [],
	});
	const { setGuideStep} = useGuide()

	const handleSave = async () => {
		if (!editingMapping) return;
		if (mappings.some((m) => m.id === editingMapping.id)) {
			await onUpdateMapping(editingMapping.id, editingMapping);
		} else {
			await onAddMapping(editingMapping);
		}
		setEditingMapping(null);
	};

	const handleAddNew = () => {
		setGuideStep(0)
		setEditingMapping({
			id: uuidv4().slice(0, 8),
			domain: DOMAIN_OPTIONS[0],
			type: TYPE_OPTIONS[0],
			uri: "",
			location_country: "",
			location_city: ["*"],
		});
	};

	const fetchFormFieldData = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
			);
			setDynamicList((prev) => {
				return { ...prev, domain: response.data.domain || [] };
			});
			console.log("form field data", response.data);
		} catch (e) {
			console.log("error while fetching form field data", e);
		}
	};

	useEffect(() => {
		fetchFormFieldData();
	}, []);
	const toggleExpand = (id: string) => {
		setExpandedMappingId((prev) => (prev === id ? null : id));
	};

	const selectClasses =
		"mt-1 block w-full pl-3 pr-10 py-2 bg-white border text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md";

	const renderEditForm = (mapping: Mapping) => (
		<div className="p-4 border rounded-lg bg-gray-50 space-y-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Domain
					</label>
					<select
						className={selectClasses}
						value={mapping.domain}
						onChange={(e) =>
							setEditingMapping({ ...mapping, domain: e.target.value })
						}
					>
						{dynamicList.domain.map((o: any) => (
							<option key={o.key}>{o.key}</option>
						))}
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Type
					</label>
					<select
						className={selectClasses}
						value={mapping.type}
						onChange={(e) =>
							setEditingMapping({ ...mapping, type: e.target.value })
						}
					>
						{TYPE_OPTIONS.map((o) => (
							<option key={o}>{o}</option>
						))}
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">URI</label>
					<input
						type="text"
						placeholder="Select URI"
						className={selectClasses}
						value={mapping.uri}
						onChange={(e) =>
							setEditingMapping({ ...mapping, uri: e.target.value })
						}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Country
					</label>
					<input
						type="text"
						placeholder="Enter Country"
						className={selectClasses}
						value={mapping.location_country}
						onChange={(e) =>
							setEditingMapping({
								...mapping,
								location_country: e.target.value,
							})
						}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						City (Comma Separated) eg: std:011, std:080 or *
					</label>
					<input
						type="text"
						placeholder="Enter City"
						className={selectClasses}
						value={mapping.location_city || ""}
						onChange={(e) => {
							const list = e.target.value.split(",").map((c) => c.trim());
							setEditingMapping({
								...mapping,
								location_city: list.length > 0 ? list : ["*"],
							});
						}}
					/>
				</div>
			</div>
			<div className="flex justify-end space-x-3">
				<button
					onClick={() => setEditingMapping(null)}
					className="text-sm font-medium text-gray-600"
				>
					Cancel
				</button>
				<button
					onClick={handleSave}
					className="px-4 py-1.5 text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
				>
					Save Mapping
				</button>
			</div>
		</div>
	);

	return (
		<div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
			<h2 className="text-xl font-bold text-gray-900">Domain Mappings</h2>
			<p className="mt-1 text-sm text-gray-600">
				Link domains to your URIs and locations.
			</p>

			<div className="mt-6">
				{editingMapping ? (
					renderEditForm(editingMapping)
				) : (
					<GuideOverlay 
					currentStep={6} 
					instruction={"Step 6: Add domain mappings"} 
					handleGoClick={handleAddNew} 
					left={0} 
					top={45}>
						<button
							onClick={handleAddNew}
							className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
						>
							+ Add Mapping
						</button>
					</GuideOverlay>
				)}
			</div>

			<div className="mt-4 space-y-3">
				{mappings.map((m) => {
					const isExpanded = expandedMappingId === m.id;
					return (
						<div
							key={m.id}
							className="bg-white border border-gray-200 rounded-lg"
						>
							<div
								className="flex items-center justify-between p-3 hover:bg-slate-50"
								onClick={() => toggleExpand(m.id)}
							>
								<span className="font-medium text-gray-800">
									{m.domain} ({m.type})
								</span>
								<div>
									<button
										// onClick={() => toggleExpand(m.id)}
										className="text-gray-400 hover:text-sky-600 mr-2 text-xl"
									>
										{/* <FaCaretDown
											className={`transition-transform duration-200 ${
												isExpanded ? "rotate-180" : ""
											}`}
										/> */}
										<svg
											className={`w-4 h-4 ml-2 text-gray-400 group-open:rotate-180 transition-transform duration-200 ${
												isExpanded ? "rotate-180" : ""
											}`}
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
									</button>
									<button
										onClick={() => onDeleteMapping(m.id)}
										className="text-gray-400 hover:text-red-600"
									>
										<TrashIcon />
									</button>
								</div>
							</div>
							{isExpanded && (
								<div className="px-5 py-4 bg-gray-50 border border-gray-100 rounded-b-lg shadow-sm text-sm text-gray-800 space-y-2 flex flex-col items-start">
									<div>
										<span className="font-semibold text-gray-900">URI:</span>{" "}
										{m.uri}
									</div>
									<div>
										<span className="font-semibold text-gray-900">
											Country:
										</span>{" "}
										{m.location_country}
									</div>
									<div>
										<span className="font-semibold text-gray-900">City:</span>{" "}
										{Array.isArray(m.location_city)
											? m.location_city.join(", ")
											: m.location_city}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
