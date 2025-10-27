// Helper function to get form values from DOM
export const getFormValues = (formIds: Record<string, string>) => {
	const values: Record<string, string> = {};
	Object.entries(formIds).forEach(([key, id]) => {
		const element = document.getElementById(id) as
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement;
		values[key] = element?.value || "";
	});
	return values;
};

// Helper function to determine step properties based on API
export const getStepProperties = (api: string) => ({
	owner: api.startsWith("on") ? ("BPP" as const) : ("BAP" as const),
	unsolicited: api.startsWith("on"),
});
