import { MockPlaygroundConfigType } from "./types";
import jsonpath from "jsonpath";
import { v4 as uuidv4 } from "uuid";
import { getFormattedContent } from "./utils";
const sampleMockConfig: MockPlaygroundConfigType = {
	meta: {
		domain: "ONDC:TRV14",
		version: "2.0.1",
		flowId: "catalog-discovery-flow",
	},
	transaction_data: {
		transaction_id: "123e4567-e89b-12d3-a456-426614174000",
		latest_timestamp: "2023-10-05T12:00:00Z",
		bap_id: "sample-bap-id",
		bap_uri: "https://bap.example.com",
		bpp_id: "sample-bpp-id",
		bpp_uri: "https://bpp.example.com",
	},
	contextFunc: `return {
		  domain: meta.domain,
		  action: meta.action,
		  location: {
		 	country: {
				code: "IND"
			} ,
			city: {
				code: meta.city
			}
		  },
		  version: "2.0.1",
		  timestamp: new Date().toISOString(),
		  transaction_id: meta.transaction_id,
		  message_id: meta.message_id,
		  bap_id: meta.bap_id,
		  bap_uri: meta.bap_uri,
		  bpp_id: meta.bpp_id,
		  bpp_uri: meta.bpp_uri,
	}`,
	steps: [
		{
			api: "search",
			action_id: "search-001",
			owner: "BAP",
			responseFor: null,
			unsolicited: false,
			description: "",
			mock: {
				generate: `
				console.log("Session Data in generateMock:", sessionData);
				return defaultPayload;
				`,
				validate: `return { valid: true, errors: [] };`,
				requirements: `{ return { valid: true }; }`,
				defaultPayload: `{"message": { "catalog": { "bpp/providers": [ { "id": "provider-1", "name": "Provider One", "items": [ { "id": "item-1", "name": "Item One", "price": { "currency": "INR", "value": "100.00" } } ] } ] } } }`,
				saveData: {
					saved_id: "$.message.catalog.id",
				},
				inputs: "{}",
			},
		},
		{
			api: "on_search",
			action_id: "on-search-001",
			owner: "BPP",
			responseFor: "search-001",
			unsolicited: false,
			description: "",
			mock: {
				generate: `function generateMock(defaultPayload, sessionData) {return defaultPayload;}`,
				validate: `function validateMock(requestPayload, sessionData) {return { valid: true, errors: [] };}`,
				requirements: `function getRequirements() { return { valid: true }; }`,
				defaultPayload: `{"message": { "catalog": { "bpp/providers": [ { "id": "provider-1", "name": "Provider One", "items": [ { "id": "item-1", "name": "Item One", "price": { "currency": "INR", "value": "100.00" } } ] } ] } } }`,
				saveData: {},
				inputs: JSON.stringify(
					{
						$schema: "http://json-schema.org/draft-07/schema#",
						type: "object",
						properties: {
							email: {
								type: "string",
								format: "email",
								minLength: 5,
								maxLength: 50,
								description: "User's email address",
							},
							age: {
								type: "integer",
								minimum: 18,
								maximum: 120,
								description: "User's age",
							},
							password: {
								type: "string",
								minLength: 8,
								pattern: "^(?=.*[A-Z])(?=.*[0-9]).+$",
								description: "Must contain uppercase and number",
							},
							website: {
								type: "string",
								format: "uri",
							},
							country: {
								type: "string",
								enum: ["US", "UK", "CA", "AU"],
							},
						},
						required: ["email", "password"],
						additionalProperties: false,
					},
					null,
					2
				),
			},
		},
	],
	transaction_history: [
		{
			action_id: "search-001",
			payload: {},
			saved_info: {},
		},
	],
};

export function generatePayload(
	index: number,
	config: MockPlaygroundConfigType = sampleMockConfig,
	inputs = {}
) {
	console.log("Generating payload for step index:", index);
	if (index < 0 || index >= config.steps.length) {
		throw new Error("Invalid step index");
	}

	const step = config.steps[index];
	const defaultPayload = JSON.parse(step.mock.defaultPayload || "{}");
	const txMeta: any = config.transaction_data;
	txMeta.action = step.api;
	txMeta.city = "std:001";
	txMeta.message_id = step.responseFor ? "" : uuidv4();
	if (step.responseFor) {
		const refStep = config.steps.find((s) => s.action_id === step.responseFor);
		if (refStep) {
			const payload = config.transaction_history.find(
				(th) => th.action_id === refStep.action_id
			)?.payload;
			const messageId = payload?.context?.message_id;
			if (messageId) {
				txMeta.message_id = messageId;
			}
		}
	}
	const contextFunc = new Function("meta", config.contextFunc);
	const context = contextFunc(txMeta);
	defaultPayload["context"] = context;
	const sessionData = getSessionDataUpToStep(index, config);
	const functionCode = step.mock.generate;
	const requiredInputs = JSON.parse(step.mock.inputs);
	return {
		defaultPayload,
		sessionData,
		functionCode,
		requiredInputs,
		actionId: step.action_id,
	};
}

export function getSessionDataUpToStep(
	index: number,
	config: MockPlaygroundConfigType = sampleMockConfig
) {
	if (index < 0 || index > config.steps.length) {
		console.error("Invalid step index for session data:", index);
		return {};
	}
	if (config.transaction_history.length < index) {
		console.error("Transaction history length less than step index:", index);
		return {};
	}
	const sessionData: any = {};
	for (let i = 0; i < index; i++) {
		const histItem = config.transaction_history[i];
		const saveData = config.steps[i].mock.saveData;
		for (const key in saveData) {
			const path = saveData[key];
			const value = jsonpath.query(histItem.payload, path)[0];
			sessionData[key] = value;
		}
	}
	return sessionData;
}

export function createInitialMockConfig(
	domain: string,
	version: string,
	flowId: string
): MockPlaygroundConfigType {
	return {
		meta: {
			domain,
			version,
			flowId,
		},
		transaction_data: {
			transaction_id: uuidv4(),
			latest_timestamp: new Date(0).toISOString(),
			bap_id: "sample-bap-id",
			bap_uri: "https://bap.example.com",
			bpp_id: "sample-bpp-id",
			bpp_uri: "https://bpp.example.com",
		},
		contextFunc: `return {
		  domain: meta.domain,
		  action: meta.action,
		  location: {
		 	country: {
				code: "IND"
			} ,
			city: {
				code: meta.city
			}
		  },
		  version: "2.0.1",
		  timestamp: new Date().toISOString(),
		  transaction_id: meta.transaction_id,
		  message_id: meta.message_id,
		  bap_id: meta.bap_id,
		  bap_uri: meta.bap_uri,
		  bpp_id: meta.bpp_id,
		  bpp_uri: meta.bpp_uri,
		}`,
		steps: [],
		transaction_history: [],
	};
}

export function getnerateContext(
	config: MockPlaygroundConfigType,
	action: string,
	responseFor: string | null = null
) {
	const txMeta: any = config.transaction_data;
	txMeta.action = action;
	txMeta.city = "std:001";
	txMeta.message_id = responseFor ? "" : uuidv4();
	if (responseFor) {
		const refStep = config.steps.find((s) => s.action_id === responseFor);
		if (refStep) {
			const payload = config.transaction_history.find(
				(th) => th.action_id === refStep.action_id
			)?.payload;
			const messageId = payload?.context?.message_id;
			if (messageId) {
				txMeta.message_id = messageId;
			}
		}
	}
	const contextFunc = new Function("meta", config.contextFunc);
	return contextFunc(txMeta);
}

export function getDefaultStep(
	action: string,
	action_id: string,
	owner: "BAP" | "BPP",
	responseFor: string | null = null,
	unsolicited = false,
	config: MockPlaygroundConfigType
): MockPlaygroundConfigType["steps"][0] {
	return {
		api: action,
		action_id: action_id,
		owner: owner,
		responseFor: responseFor,
		unsolicited: unsolicited,
		description: "",
		mock: {
			generate: getFormattedContent("generate"),
			validate: getFormattedContent("validate"),
			requirements: getFormattedContent("requirements"),
			defaultPayload: JSON.stringify(
				{
					context: getnerateContext(config, action, responseFor),
					message: {},
				},
				null,
				2
			),
			saveData: {
				message_id: "$.context.message_id",
				latestTimestamp: "$.context.timestamp",
			},
			inputs: JSON.stringify(
				{
					id: "ExampleInputId",
					jsonSchema: {
						$schema: "http://json-schema.org/draft-07/schema#",
						type: "object",
						properties: {
							email: {
								type: "string",
								format: "email",
								minLength: 5,
								maxLength: 50,
								description: "User's email address",
							},
							age: {
								type: "integer",
								minimum: 18,
								maximum: 120,
								description: "User's age",
							},
							password: {
								type: "string",
								minLength: 8,
								pattern: "^(?=.*[A-Z])(?=.*[0-9]).+$",
								description: "Must contain uppercase and number",
							},
							website: {
								type: "string",
								format: "uri",
							},
							country: {
								type: "string",
								enum: ["US", "UK", "CA", "AU"],
							},
						},
						required: ["email", "password"],
						additionalProperties: false,
					},
				},
				null,
				2
			),
		},
	};
}

export function calcCurrentIndex(config: MockPlaygroundConfigType) {
	const history = config.transaction_history;
	const steps = config.steps;
	for (const step of steps) {
		const found = history.find((h) => h.action_id === step.action_id);
		if (!found) {
			return steps.indexOf(step);
		}
	}
	return steps.length;
}

function extractFunctionBody(funcStr: string) {
	const funcBodyMatch = funcStr.match(/function[^{]*{([\s\S]*)}$/);
	if (funcBodyMatch && funcBodyMatch[1]) {
		return funcBodyMatch[1].trim();
	}
	return funcStr;
}
