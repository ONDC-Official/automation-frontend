import { Request, Response, RequestHandler } from 'express';
import { RedisService } from 'ondc-automation-cache-lib';
import logger from '@ondc/automation-logger';

// Key prefixes form a cross-service contract with the api-service GET /callback
// (which writes form_completed and reads redirection_url) — keep in sync.
//
//   form_completed:{session_id}      -> completion payload   (written by callback)
//   redirection_url:{subscriberUrl}  -> full workbench URL    (written here)
//
// Everything is session/subscriber-scoped — no transaction_id or form_id.
const FORM_COMPLETED_PREFIX = 'form_completed';
const REDIRECTION_URL_PREFIX = 'redirection_url';
const REDIRECTION_URL_TTL_SECONDS = 3600;

// After the first successful read, the completion key is re-armed with this TTL
// instead of being deleted, so a slightly-later poll on the same session can
// still observe the completion before it self-cleans.
const CONSUMED_TTL_SECONDS = 60;

/**
 * Check if the form callback has been received for a session.
 * Polled by the frontend after the form fires the callback.
 * GET /form/check-completion?session_id=X
 *
 * The api-service GET /callback writes form_completed:{session_id}.
 */
export const checkFormCompletion: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;

    logger.info('Form completion check', { session_id });

    if (!session_id) {
      res.status(400).json({
        error: 'session_id is required',
        completed: false
      });
      return;
    }

    const completionKey = `${FORM_COMPLETED_PREFIX}:${session_id}`;
    const completionData = await RedisService.getKey(completionKey);

    if (completionData) {
      const data = JSON.parse(completionData);
      logger.info('Form completion check: COMPLETED', {
        session_id,
        timestamp: data.timestamp
      });

      // Re-arm with a short TTL instead of deleting, so a slightly-later poll on
      // the same session still observes the completion before it self-cleans.
      await RedisService.setKey(completionKey, completionData, CONSUMED_TTL_SECONDS);

      res.json({
        completed: true,
        success: data.success,
        message: data.message,
        timestamp: data.timestamp
      });
      return;
    }

    logger.debug('Form completion check: PENDING (no callback yet)', { session_id });
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
 * Save the workbench tab URL to redirect back to after the form callback.
 * Keyed by the subscriberUrl embedded in the workbench URL, because the
 * api-service GET /callback has no session_id — it derives its own subscriberUrl
 * (from {subscriberUrl}/callback), looks this up, and parses sessionId out of
 * the stored URL.
 * POST /form/save-redirection   body: { redirection_url }
 */
export const saveRedirectionUrl: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { redirection_url } = req.body ?? {};

    if (!redirection_url || typeof redirection_url !== 'string') {
      res.status(400).json({ error: 'redirection_url is required' });
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

    // The workbench URL carries both ids as query params; subscriberUrl is the
    // Redis key, sessionId is what the callback parses out at read time.
    const subscriberUrl = parsed.searchParams.get('subscriberUrl');
    const sessionId = parsed.searchParams.get('sessionId');
    if (!subscriberUrl || !sessionId) {
      res.status(400).json({
        error: 'redirection_url must contain subscriberUrl and sessionId query params'
      });
      return;
    }

    await RedisService.setKey(
      `${REDIRECTION_URL_PREFIX}:${subscriberUrl}`,
      redirection_url,
      REDIRECTION_URL_TTL_SECONDS
    );
    logger.info('Redirection URL saved', { subscriberUrl, sessionId });

    res.json({ saved: true });
  } catch (error: any) {
    logger.error('Error saving redirection url', error);
    res.status(500).json({ error: 'Failed to save redirection url', message: error.message });
  }
};

/**
 * Clear any leftover form completion for a session.
 * Called by the frontend BEFORE it starts polling, so a stale completion from
 * an earlier run on the same session cannot satisfy the new poll.
 * POST /form/reset-completion?session_id=X
 */
export const resetFormCompletion: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }

    await RedisService.deleteKey(`${FORM_COMPLETED_PREFIX}:${session_id}`);
    logger.info('Form completion state reset', { session_id });

    res.json({ reset: true });

  } catch (error: any) {
    logger.error('Error resetting form completion', error);
    res.status(500).json({
      error: 'Failed to reset completion',
      message: error.message
    });
  }
};
