import { Request, Response } from "express";
import axios from "axios";

export const getFlows = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      `${process.env.CONFIG_SERVICE as string}/ui/flow`,
      {
        params: req.query,
      }
    );

    res.send(response.data);
  } catch (e: any) {
    res.status(500).send({ error: true, message: e?.message || e });
    console.log("Error while fetching flows: ", e?.message || e);
  }
};

export const getSeanrioFormData = async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(
      `${process.env.CONFIG_SERVICE as string}/ui/senario`
    );

    res.send(response.data);
  } catch (e: any) {
    res.status(500).send({ error: true, message: e?.message || e });
    console.log("Error while fetching flows: ", e?.message || e);
  }
};
