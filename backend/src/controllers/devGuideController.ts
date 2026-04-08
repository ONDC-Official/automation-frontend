import { Request, Response } from "express";
import axios from "../utils/axios";

export const getSpec = async (req: Request, res: Response) => {
    try {
        const { domain, version } = req.params;
        const response = await axios.get(
            `${process.env.CONFIG_SERVICE as string}/protocol/spec/${domain}/${version}`,
            {
                params: req.query,
            },
        );

        res.send(response.data);
    } catch (e: any) {
        res.status(500).send({ error: true, message: e?.message || e });
    }
};

export const getAvailableBuilds = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(
            `${process.env.CONFIG_SERVICE as string}/protocol/available-builds`,
            {
                params: req.query,
            },
        );
        res.send(response.data);
    } catch (e: any) {
        res.status(500).send({ error: true, message: e?.message || e });
    }
};
