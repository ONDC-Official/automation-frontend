import type { OpenAITool } from "../client/types";
import { createReadToolRegistry } from "../tools/registry";

export const TOOL_DESCRIPTIONS: OpenAITool[] = createReadToolRegistry().listDescriptions();
