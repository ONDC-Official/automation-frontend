// src/App.tsx
import { useState, useEffect, useContext } from "react";
import type { Key, Mapping } from "./registry-types";
import * as api from "../../utils/registry-apis";

// Components
import { KeysSection } from "./key-section";
// import { URIsSection } from "./uri-section";
import { MappingsSection } from "./mappingSections";
// import { LocationsSection } from "./location-section";
import { UserContext } from "../../context/userContext";

import { v4 as uuidv4 } from "uuid"; // For generating unique IDs
// You would also import LocationsSection here

interface SubscriberFormProps {
	setGuideStep: (step: number) => void;
	guideStep: number
}

const SubscriberForm = ({setGuideStep, guideStep}: SubscriberFormProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const user = useContext(UserContext);
	const [formData, setFormData] = [user.subscriberData, user.setSubscriberData];

	useEffect(() => {
		FetchUserLookUp();
	}, [user.userDetails]);

	function FetchUserLookUp() {
		api
			.getSubscriberDetails(user.userDetails)
			.then((data) => {
				if (data) {
					setFormData(data);
				} else {
					// toast.error("Failed to load subscriber details");
				}
				setIsLoading(false);
			})
			.catch((error) => {
				console.error("Error fetching subscriber details:", error);
				// toast.error("Failed to load subscriber details");
				setIsLoading(false);
			});
	}
	// --- Local state handlers (no API calls) ---

	const addKey = async (key: Key): Promise<void> => {
		try {
			const data = {
				keys: [...formData.keys, key],
			};
			await api.patch(data, user.userDetails);
			setFormData((prev) => ({ ...prev, keys: [...prev.keys, key] }));
		} catch (error) {
			console.error("Error adding key:", error);
		}
	};

	const deleteKey = async (uk_id: string): Promise<void> => {
		try {
			const data = {
				keys: formData.keys.filter((k) => k.uk_id === uk_id),
			};
			await api.delSubscriberDetails(data, user.userDetails);
			setFormData((prev) => ({
				...prev,
				keys: prev.keys.filter((k) => k.uk_id !== uk_id),
			}));
		} catch (error) {
			console.error("Error deleting key:", error);
		}
	};

	// const addUri = async (uri: Uri): Promise<void> => {
	// 	setFormData((prev) => ({ ...prev, uris: [...prev.uris, uri] }));
	// };

	// const editUri = async (id: string, uri: string): Promise<void> => {
	// 	setFormData((prev) => ({
	// 		...prev,
	// 		uris: prev.uris.map((u) => (u.id === id ? { id, uri } : u)),
	// 	}));
	// };

	// const deleteUri = async (id: string): Promise<void> => {
	// 	try {
	// 		const data = {
	// 			uris: formData.uris.filter((u) => u.id !== id),
	// 		};
	// 		await api.delSubscriberDetails(data, user.userDetails);
	// 		setFormData((prev) => ({
	// 			...prev,
	// 			uris: prev.uris.filter((u) => u.id !== id),
	// 		}));
	// 	} catch (error) {
	// 		console.error("Error deleting URI:", error);
	// 	}
	// };

	const addMapping = async (mapping: Mapping): Promise<void> => {
		try {
			const uriId = uuidv4();
			const locationId = uuidv4();
			const convertedMapping = {
				uris: [
					{
						id: uriId,
						uri: mapping.uri,
					},
				],
				locations: [
					{
						id: locationId,
						city: mapping.location_city,
						country: [mapping.location_country],
					},
				],
				mappings: [
					{
						id: uuidv4(),
						domain: mapping.domain,
						type: mapping.type,
						uri_id: uriId,
						location_id: locationId,
					},
				],
			};
			api.patch(convertedMapping, user.userDetails);
			setFormData((prev) => ({
				...prev,
				mappings: [...prev.mappings, mapping],
			}));
		} catch (error) {
			console.error("Error adding mapping:", error);
		}
	};

	const updateMapping = async (
		id: string,
		data: Partial<Mapping>
	): Promise<void> => {
		setFormData((prev) => ({
			...prev,
			mappings: prev.mappings.map((m) => (m.id === id ? { ...m, ...data } : m)),
		}));
	};

	const deleteMapping = async (id: string): Promise<void> => {
		try {
			console.log(formData);
			const data = {
				mappings: formData.mappings.filter((m) => m.id === id),
			};
			console.log(data, id);
			await api.delSubscriberDetails(data, user.userDetails);
			setFormData((prev) => ({
				...prev,
				mappings: prev.mappings.filter((m) => m.id !== id),
			}));
		} catch (error) {
			console.error("Error deleting mapping:", error);
		}
	};

	// const addLocation = async (location: Location): Promise<void> => {
	// 	setFormData((prev) => ({
	// 		...prev,
	// 		locations: [...prev.locations, location],
	// 	}));
	// };

	// const editLocation = async (
	// 	id: string,
	// 	newLocation: Location
	// ): Promise<void> => {
	// 	setFormData((prev) => ({
	// 		...prev,
	// 		locations: prev.locations.map((l) =>
	// 			l.id === id ? { ...newLocation, id } : l
	// 		),
	// 	}));
	// };

	// const deleteLocation = async (id: string): Promise<void> => {
	// 	try {
	// 		const data = {
	// 			locations: formData.locations.filter((l) => l.id !== id),
	// 		};
	// 		await api.delSubscriberDetails(data, user.userDetails);
	// 		setFormData((prev) => ({
	// 			...prev,
	// 			locations: prev.locations.filter((l) => l.id !== id),
	// 		}));
	// 	} catch (error) {
	// 		console.error("Error deleting location:", error);
	// 	}
	// };

	// --- Save configuration handler ---
	// const saveConfig = async () => {
	// 	if (!user.userDetails?.participantId) {
	// 		toast.error("Unable to save: missing participant ID");
	// 		return;
	// 	}
	// 	try {
	// 		await api.post(user.userDetails.participantId, formData);
	// 		toast.success("Configuration saved successfully");
	// 	} catch (error) {
	// 		console.error("Error saving configuration:", error);
	// 		toast.error("Failed to save configuration");
	// 	}
	// };

	if (isLoading) {
		return <div className="text-center p-10">Loading configuration...</div>;
	}

	return (
		<div className="bg-gray-100 min-h-screen relative">
			<div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
				<div className="space-y-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Registry Configuration
					</h1>

					<KeysSection
						keys={formData.keys}
						onAddKey={addKey}
						onDeleteKey={deleteKey}
						guideStep={guideStep}
						setGuideStep={setGuideStep}
					/>
					{/* <URIsSection
						uris={formData.uris}
						onAddUri={addUri}
						onEditUri={editUri}
						onDeleteUri={deleteUri}
					/>

					<LocationsSection
						locations={formData.locations}
						onAddLocation={addLocation}
						onEditLocation={editLocation}
						onDeleteLocation={deleteLocation}
					/> */}
					{/* You would add the LocationsSection here, similar to URIsSection */}
					<MappingsSection
						mappings={formData.mappings}
						// uris={formData.uris}
						// locations={formData.locations}
						onAddMapping={addMapping}
						onUpdateMapping={updateMapping}
						onDeleteMapping={deleteMapping}
						guideStep={guideStep}
						setGuideStep={setGuideStep}
					/>
					{/* Save button at bottom right */}
					{/* <div className="absolute bottom-6 right-6">
						<button
							onClick={saveConfig}
							className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
						>
							Save Config
						</button>
					</div> */}
				</div>
			</div>
		</div>
	);
};

export default SubscriberForm;
