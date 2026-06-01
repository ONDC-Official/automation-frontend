import { Request, Response } from "express";
import axiosWithApiKey from "../utils/axios";
import logger from "@ondc/automation-logger";

const DB_SERVICE = process.env.DB_SERVICE as string;
const REPORTING_SERVICE = process.env.REPORTING_SERVICE as string;

export const getPastReports = async (req: Request, res: Response) => {
    try {
        const { user_id } = req.params;
        const response = await axiosWithApiKey.get(`${DB_SERVICE}/report/user/${user_id}`, {
            headers: { Authorization: req.headers.authorization || "" },
        });
        res.send(response.data);
    } catch (e: any) {
        const status = e?.response?.status;
        if (status === 404 || status === 204) {
            res.send([]);
            return;
        }
        logger.error("Error fetching past reports", { user_id: req.params.user_id }, e);
        res.status(status || 500).send(e?.response?.data || { error: true, message: e?.message });
    }
};

/**
 * POST /reports/flow-data
 * Proxies to the report service which owns the ENABLED_DOMAINS check and Pramaan API call.
 */
export const fetchFlowData = async (req: Request, res: Response) => {
    try {
        const response = await axiosWithApiKey.post(
            `${REPORTING_SERVICE}/flow-data`,
            req.body,
            {
                headers: { "content-type": "application/json" },
                timeout: 35000,
            }
        );
        res.send(response.data);
    } catch (e: any) {
        const status = e?.response?.status;
        logger.error("Error proxying flow-data to report service", { body: req.body }, e);
        res.status(status || 500).send(e?.response?.data || { error: true, message: e?.message });
    }
};
