// FILE: configService.ts
import getConfig from "../config/yamlConfig";
import axios from "axios";
import { TriggerInput } from "../interfaces/triggerData";
import logger from "../utils/logger";

export const fetchConfigService = () => {
	const config = getConfig();
	if (!config) {
		throw new Error("Config not found");
	}
	return config;
};