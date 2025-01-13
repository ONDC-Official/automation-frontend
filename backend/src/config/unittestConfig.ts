import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";

const configPath = "../yamlConfig/unitTest.yaml";

interface Config {
  domain: Array<{
    name: string;
    usecase: {
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

const getPredefinedFlowConfig = (): Config => {
  if (!cachedConfig) {
    cachedConfig = loadConfig(configPath);
  }
  return cachedConfig;
};

export const fetchExampleConfig = (filePath: string) => {
  try {
    const configPath = path.resolve(
      __dirname,
      path.join("../yamlConfig", filePath)
    );
    const fileContents = fs.readFileSync(configPath, "utf8");
    const example = yaml.load(fileContents);
    return example;
  } catch (e: any) {
    console.error(`Failed to load config file: ${e.message}`);
    throw e;
  }
};

export default getPredefinedFlowConfig;
