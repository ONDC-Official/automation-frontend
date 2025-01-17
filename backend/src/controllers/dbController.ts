import { Request, Response } from "express";
import { getPayloadForSessionId } from "../services/dbService";

export const getPayload = async (req: Request, res: Response) => {
  const payload_id = req.query.payload_id as string;

  if (!payload_id) {
    res.status(400).send({ error: true, message: "Payload id is required" });
    return;
  }

  try {
    const response = await getPayloadForSessionId(payload_id);

    res.send(response);
  } catch (e: any) {
    res.status(500).send({ error: true, message: e?.message || e });
  }
};
