

const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const ALGORITHM = "AES-GCM";


async function importKey(sharedKeyBase64: string): Promise<CryptoKey> {
	const keyBytes = Uint8Array.from(atob(sharedKeyBase64), (c) =>
		c.charCodeAt(0)
	);
	return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM }, false, [
		"encrypt",
		"decrypt",
	]);
}

function toBase64(buffer: Uint8Array): string {
	return btoa(String.fromCharCode(...buffer));
}


function fromBase64(base64: string): Uint8Array {
	return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * @param payload   - JSON object to encrypt
 * @param sharedKey - Base64-encoded 256-bit symmetric key
 * @returns Base64-encoded encrypted string (ONDC format)
 */
export async function encryptPayload(
	payload: object,
	sharedKey: string
): Promise<string> {
	try {
		const key = await importKey(sharedKey);
		const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
		const data = new TextEncoder().encode(JSON.stringify(payload));

		const encrypted = await crypto.subtle.encrypt(
			{ name: ALGORITHM, iv: iv.buffer as ArrayBuffer, tagLength: AUTH_TAG_LENGTH_BYTES * 8 },
			key,
			data.buffer as ArrayBuffer
		);

		const encryptedBytes = new Uint8Array(encrypted);
		const ciphertext = encryptedBytes.slice(
			0,
			encryptedBytes.length - AUTH_TAG_LENGTH_BYTES
		);
		const authTag = encryptedBytes.slice(
			encryptedBytes.length - AUTH_TAG_LENGTH_BYTES
		);

		const payloadJSON = {
			encrypted_data: toBase64(ciphertext),
			hmac: toBase64(authTag),
			nonce: toBase64(iv),
		};

		return btoa(JSON.stringify(payloadJSON));
	} catch (error) {
		console.error("[Encryption] Failed to encrypt payload:", error);
		throw new Error(
			`Client encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}

/**
 * @param encryptedPayload - Base64-encoded encrypted string (ONDC format)
 * @param sharedKey        - Base64-encoded 256-bit symmetric key
 * @returns Original JSON object
 */
export async function decryptPayload(
	encryptedPayload: string,
	sharedKey: string
): Promise<object> {
	try {
		const decodedStr = atob(encryptedPayload);
		const dataJSON = JSON.parse(decodedStr);
		const { encrypted_data, hmac, nonce } = dataJSON;

		if (!encrypted_data || !hmac || !nonce) {
			throw new Error(
				"Invalid encrypted payload: missing encrypted_data, hmac, or nonce"
			);
		}

		const key = await importKey(sharedKey);
		const iv = fromBase64(nonce);
		const ciphertext = fromBase64(encrypted_data);
		const authTag = fromBase64(hmac);

		const combined = new Uint8Array(ciphertext.length + authTag.length);
		combined.set(ciphertext);
		combined.set(authTag, ciphertext.length);

		const decrypted = await crypto.subtle.decrypt(
			{ name: ALGORITHM, iv: iv.buffer as ArrayBuffer, tagLength: AUTH_TAG_LENGTH_BYTES * 8 },
			key,
			combined.buffer as ArrayBuffer
		);

		const decryptedStr = new TextDecoder().decode(decrypted);
		return JSON.parse(decryptedStr);
	} catch (error) {
		console.error("[Encryption] Failed to decrypt payload:", error);
		throw new Error(
			`Client decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}
