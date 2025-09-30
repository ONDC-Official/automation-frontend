import { Request, Response } from "express";
import axios from "axios";
import logger from "@ondc/automation-logger";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getMenu = async (req: Request, res: Response) => {
  try {
    res.send({ data: ["pizz", "burger", "soft-drink"] });
  } catch (e: any) {
    logger.error("Error in getMeny api", e);
    res.status(500).send({ error: true, message: e?.message || e });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  const { item } = req.body;
  try {
    if (item) {
      res.send({ message: `${item} is ready` });
    } else {
      res.send({ message: "You did not order any item" });
    }
  } catch (e: any) {
    logger.error("Error in getMeny api", e);
    res.status(500).send({ error: true, message: e?.message || e });
  }
};

export const placeOrder = async (req: Request, res: Response) => {
  const { item, url } = req.body;
  try {
    if (!item) {
      res.send({ message: "You did not order any item" });
      return;
    }

    res.send({ message: "Order Reieved." });

    await sleep(3000);

    const body = { message: `${item} is ready` };
    try {
      axios.post(`${url}/order`, body);
    } catch (e: any) {
      console.log("Error is guide place order api", e?.message);
    }
  } catch (e: any) {
    logger.error("Error in getMeny api", e);
    res.status(500).send({ error: true, message: e?.message || e });
  }
};
