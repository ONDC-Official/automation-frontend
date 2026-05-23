import { Request, Response, RequestHandler } from 'express';
import { RedisService } from 'ondc-automation-cache-lib';
import logger from '@ondc/automation-logger';
import { getSessionByTransactionId } from '../services/sessionService';
import { SessionCache } from '../interfaces/newSessionData';

/**
 * Check if form callback has been received
 * Polled by the frontend after user submits form in popup
 * GET /form/check-completion?transaction_id=X&form_id=Y
 */
export const checkFormCompletion: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { transaction_id, form_id } = req.query;

    logger.info('Form completion check', { transaction_id, form_id });

    if (!transaction_id || !form_id) {
      res.status(400).json({
        error: 'transaction_id and form_id are required',
        completed: false
      });
      return;
    }

    // Fetch session data via reverse-index (txn:session:{transaction_id} -> sessionId)
    // Non-fatal: a missing entry means the flow pre-dates this index or was never registered.
    const sessionData: any | null = await getSessionByTransactionId(
      transaction_id as string
    );
    if (sessionData) {
      logger.info('Session data resolved for form completion check', {
        transaction_id,
        form_id,
        domain: sessionData.domain,
        subscriberUrl: sessionData.subscriberUrl,
        npType: sessionData.npType,
        sessionData,
      });
    } else {
      logger.warning('Could not resolve session for transaction_id', {
        transaction_id,
        form_id,
      });
    }

    
    const completionKey = `form_completed:${transaction_id}:${form_id}`;
    const completionData = await RedisService.getKey(completionKey);

    if (completionData) {
      const data = JSON.parse(completionData);
      logger.info('Form completion check: COMPLETED', {
        transaction_id,
        form_id,
        timestamp: data.timestamp
      });

      res.json({
        completed: true,
        success: data.success,
        message: data.message,
        timestamp: data.timestamp
      });
      return;
    }

    logger.debug('Form completion check: PENDING', { transaction_id, form_id });
    res.json({ completed: false });

  } catch (error: any) {
    logger.error('Error checking form completion', error);
    res.status(500).json({
      error: 'Failed to check completion',
      message: error.message,
      completed: false
    });
  }
};
