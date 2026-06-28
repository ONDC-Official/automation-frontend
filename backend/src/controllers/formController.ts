import { Request, Response, RequestHandler } from 'express';
import { RedisService } from 'ondc-automation-cache-lib';
import logger from '@ondc/automation-logger';

// Key prefixes form a cross-service contract with the api-service GET /callback
// (the Go workbench-callback-redirect plugin) — keep in sync.
//
//   form_completed:{transaction_id}  -> completion payload (written by the callback)
//   redirection_url:{transaction_id} -> full workbench URL (written here)
//
// Both are keyed by transaction_id. The callback now receives transaction_id
// (and form_id) directly as query params, so no path/session derivation is needed.
const FORM_COMPLETED_PREFIX = 'form_completed';
const REDIRECTION_URL_PREFIX = 'redirection_url';
const REDIRECTION_URL_TTL_SECONDS = 3600;

// After the first successful read, the completion key is re-armed with this TTL
// instead of being deleted, so a slightly-later poll on the same transaction can
// still observe the completion before it self-cleans.
const CONSUMED_TTL_SECONDS = 60;

/**
 * Check if the form callback has been received for a transaction.
 * Polled by the frontend after the form fires the callback.
 * GET /form/check-completion?transaction_id=X
 *
 * The api-service GET /callback writes form_completed:{transaction_id}.
 */
export const checkFormCompletion: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.query;

    logger.info('Form completion check', { transaction_id });

    if (!transaction_id) {
      res.status(400).json({
        error: 'transaction_id is required',
        completed: false
      });
      return;
    }

    const completionKey = `${FORM_COMPLETED_PREFIX}:${transaction_id}`;
    const completionData = await RedisService.getKey(completionKey);

    if (completionData) {
      const data = JSON.parse(completionData);
      logger.info('Form completion check: COMPLETED', {
        transaction_id,
        form_id: data.form_id,
        timestamp: data.timestamp
      });

      // Re-arm with a short TTL instead of deleting, so a slightly-later poll on
      // the same transaction still observes the completion before it self-cleans.
      await RedisService.setKey(completionKey, completionData, CONSUMED_TTL_SECONDS);

      res.json({
        completed: true,
        success: data.success,
        message: 'Form completed',
        timestamp: data.timestamp
      });
      return;
    }

    logger.debug('Form completion check: PENDING (no callback yet)', { transaction_id });
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

/**
 * Clear any leftover form completion for a transaction.
 * Called by the frontend BEFORE it starts polling, so a stale completion from
 * an earlier run on the same transaction cannot satisfy the new poll.
 * POST /form/reset-completion   body: { transaction_id }
 */
export const resetFormCompletion: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.body ?? {};

    if (!transaction_id || typeof transaction_id !== 'string') {
      res.status(400).json({ error: 'transaction_id is required' });
      return;
    }

    await RedisService.deleteKey(`${FORM_COMPLETED_PREFIX}:${transaction_id}`);
    logger.info('Form completion state reset', { transaction_id });

    res.json({ reset: true });

  } catch (error: any) {
    logger.error('Error resetting form completion', error);
    res.status(500).json({
      error: 'Failed to reset completion',
      message: error.message
    });
  }
};

/**
 * Save the workbench tab URL to redirect back to after the form callback.
 * Keyed by transaction_id, which the callback receives directly as a query param
 * and uses to look this URL up (and to write form_completed:{transaction_id}).
 * POST /form/save-redirection   body: { redirection_url, transaction_id }
 *
 * The frontend sends its current page URL verbatim plus the transaction_id.
 */
export const saveRedirectionUrl: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { redirection_url, transaction_id } = req.body ?? {};

    if (!redirection_url || typeof redirection_url !== 'string') {
      res.status(400).json({ error: 'redirection_url is required' });
      return;
    }

    if (!transaction_id || typeof transaction_id !== 'string') {
      res.status(400).json({ error: 'transaction_id is required' });
      return;
    }

    // Open-redirect guard: only store http(s) URLs (a browser is later sent here).
    let parsed: URL;
    try {
      parsed = new URL(redirection_url);
    } catch {
      res.status(400).json({ error: 'redirection_url is not a valid URL' });
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).json({ error: 'redirection_url must be http(s)' });
      return;
    }

    await RedisService.setKey(
      `${REDIRECTION_URL_PREFIX}:${transaction_id}`,
      redirection_url,
      REDIRECTION_URL_TTL_SECONDS
    );
    logger.info('Redirection URL saved', { transaction_id });

    res.json({ saved: true });
  } catch (error: any) {
    logger.error('Error saving redirection url', error);
    res.status(500).json({ error: 'Failed to save redirection url', message: error.message });
  }
};
