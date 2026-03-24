/**
 * AES-256-GCM Encryption Utility
 *
 * Ported from ONDC reference implementation:
 * https://github.com/ONDC-Official/reference-implementations/tree/main/utilities/aes-gcm-nodejs
 *
 * Provides encryptPayload / decryptPayload for ONDC payload encryption.
 * Currently scoped for FIS13 (Health Insurance), scalable to all domains.
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import logger from "@ondc/automation-logger";

// ─── Constants (from ONDC reference constants.js) ───────────────────────────
const IV_LENGTH_IN_BITS = 96;
const AUTH_TAG_LENGTH_IN_BITS = 128; // Cannot be changed for AES-256-GCM
const ENCRYPT_DECRYPT_ALGORITHM = "aes-256-gcm";
const KEY_STRING_FORMAT: BufferEncoding = "base64";

const AUTH_TAG_LENGTH_IN_BYTES = Math.ceil(AUTH_TAG_LENGTH_IN_BITS / 8);
const IV_LENGTH_IN_BYTES = Math.ceil(IV_LENGTH_IN_BITS / 8);

// ─── Internal helper ────────────────────────────────────────────────────────

/**
 * Constructs a JSON with encrypted_data, hmac, and nonce, then base64 encodes it.
 */
function convertPayloadToBase64(
	encryptedMessage: string,
	hmac: string,
	iv: string
): string {
	const returnPayloadJSON = {
		encrypted_data: encryptedMessage,
		hmac: hmac,
		nonce: iv,
	};

	const returnPayloadString = JSON.stringify(returnPayloadJSON);
	return Buffer.from(returnPayloadString, "utf8").toString(KEY_STRING_FORMAT);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Encrypt a payload object using AES-256-GCM.
 *
 * @param payload  - The JSON object to encrypt
 * @param sharedKey - Base64-encoded 256-bit symmetric key
 * @returns Base64-encoded encrypted string (contains encrypted_data, hmac, nonce)
 */
export function encryptPayload(payload: object, sharedKey: string): string {
	try {
		const data = JSON.stringify(payload);
		const iv = randomBytes(IV_LENGTH_IN_BYTES);
		const sharedKeyBytes = Buffer.from(sharedKey, KEY_STRING_FORMAT);

		const cipher = createCipheriv(
			ENCRYPT_DECRYPT_ALGORITHM,
			sharedKeyBytes,
			iv,
			{ authTagLength: AUTH_TAG_LENGTH_IN_BYTES }
		);

		const encryptedMessage =
			cipher.update(data, "utf8", KEY_STRING_FORMAT) +
			cipher.final(KEY_STRING_FORMAT);

		const authTag = cipher.getAuthTag();
		const authTagBase64 = authTag.toString(KEY_STRING_FORMAT);

		const digest = convertPayloadToBase64(
			encryptedMessage,
			authTagBase64,
			iv.toString(KEY_STRING_FORMAT)
		);

		if (process.env.NODE_ENV !== "production") {
			logger.info("[Encryption] Payload encrypted successfully", {
				originalSize: data.length,
				encryptedSize: digest.length,
			});
		}

		return digest;
	} catch (error) {
		logger.error("[Encryption] Failed to encrypt payload", {}, error);
		throw new Error(
			`Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}

/**
 * Decrypt an AES-256-GCM encrypted payload.
 *
 * @param encryptedPayload - Base64-encoded encrypted string
 * @param sharedKey        - Base64-encoded 256-bit symmetric key
 * @returns The original JSON object
 */
export function decryptPayload(
	encryptedPayload: string,
	sharedKey: string
): object {
	try {
		const decodedData = Buffer.from(
			encryptedPayload,
			KEY_STRING_FORMAT
		).toString("utf8");
		const dataJSON = JSON.parse(decodedData);
		const { encrypted_data, hmac, nonce } = dataJSON;

		if (!encrypted_data || !hmac || !nonce) {
			throw new Error(
				"Invalid encrypted payload: missing encrypted_data, hmac, or nonce"
			);
		}

		const authTag = Buffer.from(hmac, KEY_STRING_FORMAT);
		const sharedKeyBytes = Buffer.from(sharedKey, KEY_STRING_FORMAT);
		const nonceBytes = Buffer.from(nonce, KEY_STRING_FORMAT);

		const decipher = createDecipheriv(
			ENCRYPT_DECRYPT_ALGORITHM,
			sharedKeyBytes,
			nonceBytes,
			{ authTagLength: AUTH_TAG_LENGTH_IN_BYTES }
		);
		decipher.setAuthTag(authTag);

		const decryptedMessage =
			decipher.update(encrypted_data, KEY_STRING_FORMAT, "utf8") +
			decipher.final("utf8");

		if (process.env.NODE_ENV !== "production") {
			logger.info("[Encryption] Payload decrypted successfully", {
				decryptedSize: decryptedMessage.length,
			});
		}

		return JSON.parse(decryptedMessage);
	} catch (error) {
		logger.error("[Encryption] Failed to decrypt payload", {}, error);
		throw new Error(
			`Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}
