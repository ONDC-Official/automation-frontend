import { PlaygroundActionStep } from "../mock-engine/types";

export const ONDC_ACTION_LIST = [
	"search",
	"select",
	"init",
	"confirm",
	"status",
	"track",
	"cancel",
	"update",
	"on_search",
	"on_select",
	"on_init",
	"on_confirm",
	"on_status",
	"on_track",
	"on_cancel",
	"on_update",
	"issue",
	"on_issue",
] as const;
export type PlaygroundLeftTabType =
	| "generator"
	| "default"
	| "inputs"
	| "requirements";
export type PlaygroundRightTabType = "session" | "transaction" | "terminal";

export type MockPropertyTab = {
	id: string;
	label: string;
	language: "javascript" | "json";
	property: keyof PlaygroundActionStep["mock"];
};

export const PLAYGROUND_LEFT_TABS: MockPropertyTab[] = [
	{
		id: "generate",
		label: "generator.js",
		language: "javascript",
		property: "generate",
	},
	{
		id: "validate",
		label: "validator.js",
		language: "javascript",
		property: "validate",
	},
	{
		id: "requirements",
		label: "requirements.js",
		language: "javascript",
		property: "requirements",
	},
	{
		id: "defaultPayload",
		label: "defaultPayload.json",
		language: "json",
		property: "defaultPayload",
	},
	{
		id: "inputs",
		label: "inputs.json",
		language: "json",
		property: "inputs",
	},
];

export type PlaygroundRightTab = {
	id: PlaygroundRightTabType;
	label: string;
};

export const PLAYGROUND_RIGHT_TABS: PlaygroundRightTab[] = [
	{
		id: "session",
		label: "Live Session Data",
	},
	{
		id: "transaction",
		label: "Transaction History",
	},
	{
		id: "terminal",
		label: "Terminal",
	},
];
