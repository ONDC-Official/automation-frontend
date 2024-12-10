// FILE: uiController.ts
import { Request, Response } from "express";
import { fetchConfigService } from "../services/flowService";
import axios from 'axios';
import { TriggerInput } from '../interfaces/triggerData';
import { ACK, NACK, ERROR } from '../constants/response';

export const fetchConfig = (req: Request, res: Response) => {
    try {
        const config = fetchConfigService();
        res.status(200).json(config);
    } catch (error: any) {
        if (error.message === "Config not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

export const generateReport = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
        res.status(400).json({ error: 'session_id is required' });
        return;
    }
    try {
        const response = await axios.get(`${process.env.REPORTING_SERVICE}/generate-report?sessionId=${sessionId}`);
        if (response.status === 200) {
            res.status(200).json({ message: 'Report generated successfully' });
        }
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
};

export const handleTriggerRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.body.subscriberUrl) {
            res.status(400).send('Bad Request');
            return;
        }

        const triggerInput: TriggerInput = req.body;

        const response = await axios.post(`${process.env.MOCK_SERVICE as string}/trigger`, triggerInput);
        if (response.status === 200) {
            res.status(200).send(ACK);
        } else {
            res.status(response.status).send('unknown');
        }
    } catch (error: any) {
        if (error.response && error.response.status === 400) {
            res.status(400).send(NACK);
        } else if (error.response && error.response.status === 500) {
            res.status(500).send(ERROR);
        } else {
            res.status(500).send(ERROR);
        }
    }
};