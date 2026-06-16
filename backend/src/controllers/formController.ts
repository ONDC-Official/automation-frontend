import { Request, Response, RequestHandler } from 'express';
import { RedisService } from 'ondc-automation-cache-lib';
import logger from '@ondc/automation-logger';

// Key prefixes form a cross-service contract with the api-service GET /callback
// (the Go workbench-callback-redirect plugin) — keep in sync.
//
//   form_completed:{session_id}      -> completion payload (written by the callback)
//   redirection_url:{subscriberPath} -> full workbench URL (written here)
//
// The redirection key is the subscriber URL *pathname* (e.g.
// /api-service/ONDC:FIS12/2.3.0/buyer), NOT the full URL — so the callback can
// derive the same key from its own request path alone, independent of host,
// scheme and the reverse proxy (nginx). The callback parses sessionId out of the
// stored workbench URL to write form_completed:{session_id}.
const FORM_COMPLETED_PREFIX = 'form_completed';
const REDIRECTION_URL_PREFIX = 'redirection_url';
const REDIRECTION_URL_TTL_SECONDS = 3600;
const API_SERVICE_ANCHOR = '/api-service/';

// After the first successful read, the completion key is re-armed with this TTL
// instead of being deleted, so a slightly-later poll on the same session can
// still observe the completion before it self-cleans.
const CONSUMED_TTL_SECONDS = 60;

// Normalize a subscriber URL to the path key both sides agree on: the pathname
// from "/api-service/" onward, without a trailing slash. Must stay byte-identical
// to the api-service callback's derivation.
function subscriberPathKey(subscriberUrl: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(subscriberUrl).pathname;
  } catch {
    return null;
  }
  const i = pathname.indexOf(API_SERVICE_ANCHOR);
  if (i >= 0) {
    pathname = pathname.slice(i);
  }
  pathname = pathname.replace(/\/+$/, '');
  return pathname || null;
}

// We always receive the seller's redirection URL, but the form callback arrives
// at the buyer's subscriber path. So the key is stored under the buyer path while
// the stored value (the seller's workbench URL) is left exactly as received.
function sellerToBuyerPath(path: string): string {
  return path.endsWith('/seller')
    ? path.slice(0, -'/seller'.length) + '/buyer'
    : path;
}

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

/**
 * Save the workbench tab URL to redirect back to after the form callback.
 * Keyed by the subscriber URL *pathname* embedded in the workbench URL, because
 * the api-service GET /callback has no session_id — it derives the same path key
 * from its own request path (nginx-independent), looks this up, and parses
 * sessionId out of the stored URL.
 * POST /form/save-redirection   body: { redirection_url }
 *
 * The frontend sends its current page URL verbatim; it already carries
 * subscriberUrl and sessionId as query params.
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

    // The workbench URL carries both ids as query params; the subscriberUrl's
    // pathname is the Redis key, sessionId is what the callback parses out at
    // read time.
    const subscriberUrl = parsed.searchParams.get('subscriberUrl');
    const sessionId = parsed.searchParams.get('sessionId');
    if (!subscriberUrl || !sessionId) {
      res.status(400).json({
        error: 'redirection_url must contain subscriberUrl and sessionId query params'
      });
      return;
    }

    const subscriberPath = subscriberPathKey(subscriberUrl);
    if (!subscriberPath) {
      res.status(400).json({
        error: 'subscriberUrl must be a valid URL containing an /api-service/ path'
      });
      return;
    }

    // Store under the buyer path (the callback hits the buyer side); the
    // redirection_url value itself is left untouched.
    const keyPath = sellerToBuyerPath(subscriberPath);

    await RedisService.setKey(
      `${REDIRECTION_URL_PREFIX}:${keyPath}`,
      redirection_url,
      REDIRECTION_URL_TTL_SECONDS
    );
    logger.info('Redirection URL saved', { subscriberPath, keyPath, sessionId });

    res.json({ saved: true });
  } catch (error: any) {
    logger.error('Error saving redirection url', error);
    res.status(500).json({ error: 'Failed to save redirection url', message: error.message });
  }
};
