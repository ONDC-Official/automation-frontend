import { Request, Response } from "express";
import {
  getPayloadForSessionId,
  getReportForSessionId,
  getSessionsForSubId,
  createUser,
  addFlowToSession,
  updateFlowInSession,
} from "../services/dbService";
import logger from "@ondc/automation-logger";

export const getPayload = async (req: Request, res: Response) => {
  const body = req.body;

  if (!body?.payload_ids?.length) {
    res.status(400).send({ error: true, message: "Payload ids are required" });
    return;
  }

  try {
    const response = await getPayloadForSessionId(body.payload_ids);

    res.send(response);
  } catch (e: any) {
    logger.error(
      "Error fetching payload for session ids",
      { payload_ids: body.payload_ids },
      e
    );
    res.status(500).send({ error: true, message: e?.message || e });
  }
};

export const getReport = async (req: Request, res: Response) => {
  const sessionId: string = req.query.session_id as string;

  if (!sessionId) {
    res.status(400).send({ error: true, message: "Session id is required" });
    return;
  }

  try {
    const response = await getReportForSessionId(sessionId);

    res.send(response);
  } catch (e: any) {
    logger.error(
      "Error fetching payload for session ids",
      { payload_ids: sessionId },
      e
    );
    res.status(500).send({ error: true, message: e?.message || e });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  const subID: string = req.query.sub_id as string;
  const npType: string = req.query.np_type as string;

  if (!subID || !npType) {
    res
      .status(400)
      .send({ error: true, message: "sub_id and np_type are required" });
    return;
  }

  try {
    const response = await getSessionsForSubId(subID, npType);

    res.send(response);
  } catch (e: any) {
    logger.error(
      "Error fetching payload for session ids",
      { payload_ids: subID, npType },
      e
    );
    res.status(500).send({ error: true, message: e?.message || e });
  }
};

export const createUserController = async (req: Request, res: Response) => {
  const { githubId, participantId } = req.body;

  if (!githubId || !participantId) {
    res.status(400).send({
      error: true,
      message: "githubId and participantId are required",
    });
    return;
  }

  try {
    const response = await createUser({ githubId, participantId });
    res.status(201).send(response);
  } catch (e: any) {
    logger.error("Error creating user", { githubId, participantId, error: e });
    res
      .status(500)
      .send({ error: true, message: e?.message || "Error creating user" });
  }
};

export const updateFlowInSessionController = async (
  req: Request,
  res: Response
) => {
  const { sessionId } = req.params;
  const { flow } = req.body;

  if (!sessionId || !flow) {
    res
      .status(400)
      .send({ error: true, message: "sessionId and flow are required" });
    return;
  }

  try {
    const response = await updateFlowInSession(sessionId, flow);
    res.status(200).send(response);
  } catch (e: any) {
    logger.error("Error updating flow in session", {
      sessionId,
      flow,
      error: e,
    });
    res
      .status(500)
      .send({ error: true, message: e?.message || "Error updating flow" });
  }
};

export const addFlowToSessionController = async (
  req: Request,
  res: Response
) => {
  const { sessionId } = req.params;
  const { id, status } = req.body;

  if (!sessionId || !id || !status) {
    res
      .status(400)
      .send({ error: true, message: "sessionId, id, and status are required" });
    return;
  }

  try {
    const response = await addFlowToSession(sessionId, { id, status });
    res.status(201).send(response);
  } catch (e: any) {
    logger.error("Error adding flow to session", {
      sessionId,
      id,
      status,
      error: e,
    });
    res
      .status(500)
      .send({ error: true, message: e?.message || "Error adding flow" });
  }
};
