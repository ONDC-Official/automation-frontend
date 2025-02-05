import { Request, Response } from "express";
import { getPayloadForSessionId } from "../services/dbService";

export const getPayload = async (req: Request, res: Response) => {
  const body = req.body

  if (!body?.payload_ids?.length) {
    res.status(400).send({ error: true, message: "Payload ids are required" });
    return;
  }

  try {
    const response = await getPayloadForSessionId(body.payload_ids);

    res.send(response);
  } catch (e: any) {
    res.status(500).send({ error: true, message: e?.message || e });
  }
};
