import { FUNCTION_REGISTRY } from "./code-runners/function-registry";

export function getFormattedContent(id: string) {
	console.log("Getting formatted content for id:", id);
	return FUNCTION_REGISTRY[id].template(FUNCTION_REGISTRY[id].defaultBody);
}
