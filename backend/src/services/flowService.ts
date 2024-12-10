// FILE: configService.ts
import getConfig from "../config/yamlConfig";
import axios from 'axios';
import { TriggerInput } from "../interfaces/triggerData";

export const fetchConfigService = () => {
    const config = getConfig();
    if (!config) {
        throw new Error("Config not found");
    }
    return config;
};

export const triggerMockService = async (triggerInput: TriggerInput): Promise<string> => {
    try {
        const response = await axios.post(`${process.env.MOCK_SERVICE as string}/trigger`);
    } catch (error: any) {
        if (error.response && error.response.status === 400) {
            return 'fail';
        } else if (error.response && error.response.status === 500) {
            return 'error';
        }
        throw error;
    }
    return 'unknown';
};