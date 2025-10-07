export function getFormattedContent(id: string, value: string) {
	return getEditorBaseContent(id, value);
}

function getEditorBaseContent(id: string, value: string): string {
	if (id === "generate") {
		return `/**
 * Generates the mock payload for an API call in the transaction flow.
 * This function allows customization of the default payload using session data
 * from previous steps and user inputs.
 * 
 * @param {Object} defaultPayload - The base payload object with context already populated.
 *                                   Includes domain, action, transaction_id, message_id, etc.
 * @param {Object} sessionData - Data collected from previous transaction steps.
 * @param {Object} sessionData.user_inputs - User-provided input values for this step.
 * @param {*} sessionData.[key] - Any saved data from previous steps (defined in saveData config).
 *                                 Access saved values like sessionData.saved_id, sessionData.provider_id, etc.
 * 
 * @returns {Object} The generated payload object to be sent in the API request.
 *                   Should maintain the structure expected by the ONDC protocol.
 */
function generate(defaultPayload, sessionData) {
${value}
}`;
	}
	if (id === "validate") {
		return `
/**
 * Validates the incoming request payload for an API call in the transaction flow.
 * This function checks if the payload meets the required criteria and returns
 * a validation result.
 * 
 * @param {Object} targetPayload - The incoming request payload to validate.
 * @param {Object} sessionData - Data collected from previous transaction steps.
 * @param {*} sessionData.[key] - Any saved data from previous steps (defined in saveData config).
 *                                 Access saved values like sessionData.saved_id, sessionData.provider_id, etc.
 * 
 * @returns {Object} An object containing:
 *                   - valid: {boolean} Whether the payload is valid or not.
 *                   - code: {number} error code
 *                   - description: {string} A message describing the validation result.
 */
function validate(targetPayload, sessionData) {
	return { valid: true, code: 200, description: "Valid request" };
}`;
	}
	if (id === "requirements") {
		return `
/**
 * Checks if the requirements for proceeding with the API call are met.
 * This function can enforce preconditions based on session data and user inputs.
 * 
 * @param {Object} sessionData - Data collected from previous transaction steps.
 * @param {Object} sessionData.user_inputs - User-provided input values for this step.
 * @param {*} sessionData.[key] - Any saved data from previous steps (defined in saveData config).
 *                                 Access saved values like sessionData.saved_id, sessionData.provider_id, etc.
 * 
 * @returns {Object} An object containing:
 *                   - valid: {boolean} Whether the requirements are met.
 *                   - code: {number} status code
 *                   - description: {string} A message describing the requirement check result.
 */
function meetsRequirements(sessionData) {
	return { valid: true, code: 200, description: "Requirements met" };
}
		`;
	}
	return "";
}

export function extractFunctionBody(
	code: string,
	functionName: string
): string {
	const functionRegex = new RegExp(
		`function\\s+${functionName}\\s*\\(([^)]*)\\)\\s*{([\\s\\S]*)}`,
		"m"
	);
	const match = code.match(functionRegex);
	if (match && match[2]) {
		return match[2].trim();
	}
	return code.trim();
}
