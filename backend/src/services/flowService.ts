// FILE: configService.ts
import getConfig from "../config/yamlConfig";

export const fetchConfigService = () => {
	const config = getConfig();
	if (!config) {
		throw new Error("Config not found");
	}
	return config;
};
