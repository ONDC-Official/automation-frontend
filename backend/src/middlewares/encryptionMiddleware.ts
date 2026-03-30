

import { Request, Response, NextFunction } from "express";
import { encryptPayload, decryptPayload } from "../utils/encryption";
import { getSessionService } from "../services/sessionService";
import { ACK, NACK } from "../constants/response";
import logger from "@ondc/automation-logger";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const isStaging = process.env.NODE_ENV !== "production";

// Scope constants
const ALLOWED_DOMAIN = "FIS13";
const ALLOWED_DOMAIN_PREFIXED = "ONDC:FIS13";
const ALLOWED_USECASE = "HEALTH INSURANCE";
const ALLOWED_VERSION = "2.0.1";


async function getEncryptionContext(req: Request): Promise<{ enabled: boolean; session?: any }> {
    if (req.query.encryptionEnabled === "true") return { enabled: true };
    if (req.headers["x-encryption-enabled"] === "true") return { enabled: true };

    const sessionId = (req.query.session_id || req.body?.session_id || req.query.sessionId || req.body?.sessionId) as string;
    const transactionId = (req.query.transaction_id || req.body?.transaction_id || req.body?.context?.transaction_id) as string;

    const idToLookup = sessionId || transactionId;

    if (idToLookup) {
        try {
            const session = await getSessionService(idToLookup);
            const isToggledOn = session?.sessionDifficulty?.encryptionEnabled === true;

            // If toggled on, verify it's within the allowed ONDC scope
            const domainMatch = session.domain === ALLOWED_DOMAIN || session.domain === ALLOWED_DOMAIN_PREFIXED;
            const usecaseMatch = session.usecaseId === ALLOWED_USECASE;
            const versionMatch = session.version === ALLOWED_VERSION;

            if (isToggledOn && domainMatch && usecaseMatch && versionMatch) {
                return { enabled: true, session };
            }
        } catch (e) {
            console.log("Error in getEncryptionContext", e);

        }
    }

    const headerDomain = req.headers["x-domain"] || req.headers["x-ondc-domain"];
    const headerUsecase = req.headers["x-usecase"] || req.headers["x-ondc-usecase"];
    const headerVersion = req.headers["x-version"] || req.headers["x-ondc-version"];

    if (headerDomain && headerUsecase && headerVersion) {
        const hDomainMatch = headerDomain === ALLOWED_DOMAIN || headerDomain === ALLOWED_DOMAIN_PREFIXED;
        const hUsecaseMatch = headerUsecase === ALLOWED_USECASE;
        const hVersionMatch = headerVersion === ALLOWED_VERSION;

        if (hDomainMatch && hUsecaseMatch && hVersionMatch) {
            return { enabled: false };
        }
    }

    return { enabled: false };
}


export async function encryptionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { enabled } = await getEncryptionContext(req);

    if (!enabled) {
        next();
        return;
    }

    if (!ENCRYPTION_KEY) {
        logger.error(
            "[EncryptionMiddleware] ENCRYPTION_KEY is not configured but encryption was requested"
        );
        res.status(500).json({
            error: "Encryption key not configured on server",
        });
        return;
    }

    // ── Decrypt incoming request ─────────────────────────────────────────
    try {
        if (req.body && typeof req.body === "string") {
            // Body is an encrypted base64 string
            if (isStaging) {
                logger.info(
                    "[EncryptionMiddleware] Encrypted request payload received",
                    {
                        encryptedPayload:
                            req.body.substring(0, 100) + "...",
                    }
                );
            }

            const decrypted = decryptPayload(req.body, ENCRYPTION_KEY);
            req.body = decrypted;

            if (isStaging) {
                logger.info(
                    "[EncryptionMiddleware] Request decrypted successfully",
                    {
                        decryptedPayload: JSON.stringify(decrypted).substring(
                            0,
                            200
                        ),
                    }
                );
            }
        } else if (
            req.body &&
            typeof req.body === "object" &&
            req.body.encrypted_payload
        ) {
            // Body is JSON with an encrypted_payload field
            if (isStaging) {
                logger.info(
                    "[EncryptionMiddleware] Encrypted payload field detected"
                );
            }

            const decrypted = decryptPayload(
                req.body.encrypted_payload,
                ENCRYPTION_KEY
            );
            req.body = decrypted;

            if (isStaging) {
                logger.info(
                    "[EncryptionMiddleware] Request decrypted successfully",
                    {
                        decryptedPayload: JSON.stringify(decrypted).substring(
                            0,
                            200
                        ),
                    }
                );
            }
        }
        // else: body is already a normal JSON object — no decryption needed
    } catch (error) {
        logger.error(
            "[EncryptionMiddleware] Failed to decrypt incoming request",
            {},
            error
        );
        res.status(400).json({
            error: "Failed to decrypt request payload",
            message:
                error instanceof Error ? error.message : "Unknown decryption error",
        });
        return;
    }

    // ── Encrypt outgoing response ────────────────────────────────────────
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown): Response {
        try {
            if (body && typeof body === "object") {
                // Skip encryption for simple ACK/NACK responses common in automation flows
                const bodyStr = JSON.stringify(body);
                if (bodyStr === JSON.stringify(ACK) || bodyStr === JSON.stringify(NACK)) {
                    return originalJson(body);
                }

                const encrypted = encryptPayload(
                    body as object,
                    ENCRYPTION_KEY
                );

                if (isStaging) {
                    logger.info(
                        "[EncryptionMiddleware] Response encrypted successfully",
                        {
                            originalSize: JSON.stringify(body).length,
                            encryptedPayload: encrypted.substring(0, 100) + "...",
                        }
                    );
                }

                return originalJson({
                    encrypted_payload: encrypted,
                    encryptionEnabled: true,
                });
            }
        } catch (error) {
            logger.error(
                "[EncryptionMiddleware] Failed to encrypt outgoing response",
                {},
                error
            );
        }

        return originalJson(body);
    };

    next();
}

export default encryptionMiddleware;
