import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";

const configPath = "../yamlConfig/index.yaml";

interface Config {
	domain: Array<{
		name: string;
		flows: {
			id: string;
			description: string;
			sequence: {
				[key: string]: {
					key: string;
					type: string;
					pair: string | null;
					unsolicited: boolean;
					description: string;
				};
			}[];
		}[];
	}>;
}

const loadConfig = (filePath: string): Config => {
	try {
		const configPath = path.resolve(__dirname, filePath);
		const fileContents = fs.readFileSync(configPath, "utf8");
		const config = yaml.load(fileContents) as Config;
		return config;
	} catch (e: any) {
		console.error(`Failed to load config file: ${e.message}`);
		throw e;
	}
};

let cachedConfig: Config | null = null;

const getConfig = (): Config => {
	if (!cachedConfig) {
		cachedConfig = loadConfig(configPath);
	}
	return cachedConfig;
};

export default getConfig;
