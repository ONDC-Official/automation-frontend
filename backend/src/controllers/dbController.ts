import { Request, Response } from "express";
import { getPayloadForSessionId } from "../services/dbService";

export const getPayload = async (req: Request, res: Response) => {
  const session_id = req.query.session_id as string;

  if (!session_id) {
    res.status(400).send({ error: true, message: "Session id is required" });
  }

  try {
    const response = await getPayloadForSessionId(session_id);

    res.send(response);
  } catch (e: any) {
    res.status(500).send({ error: true, message: e?.message || e });
  }
};
