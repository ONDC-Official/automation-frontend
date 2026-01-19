// Code snippets for Auth Header Generation and Verification
// All implementations use BLAKE-512 hashing and Ed25519 signatures

export const codeSnippets = {
    python: {
        language: "python",
        label: "Python",
        generate: `def create_authorisation_header(payload: str, private_key: str, 
                              subscriber_id: str, unique_key_id: str) -> tuple[str, str]:
    """
    Create ONDC authorization header from raw JSON payload string.
    Uses BLAKE-512 for hashing and Ed25519 for signing.
    """
    if not isinstance(payload, str):
        raise ValueError("payload must be a string, not dict or other type")
    
    current_time = int(time.time())
    ttl = 3600  # 1 hour
    
    # Hash the exact payload string as provided
    hash_obj = hashlib.blake2b(payload.encode(), digest_size=64)
    digest = base64.b64encode(hash_obj.digest()).decode()
    
    # Create signing string
    signing_string = f"(created): {current_time}\\n(expires): {current_time + ttl}\\ndigest: BLAKE-512={digest}"
    
    # Decode private key and sign
    private_key_bytes = base64.b64decode(private_key)
    signing_key = SigningKey(private_key_bytes[:32])
    signature = signing_key.sign(signing_string.encode()).signature
    signature_b64 = base64.b64encode(signature).decode()
    
    # Create authorization header
    auth_header = f'Signature keyId="{subscriber_id}|{unique_key_id}|ed25519",' \\
                  f'algorithm="ed25519",created="{current_time}",' \\
                  f'expires="{current_time + ttl}",headers="(created) (expires) digest",' \\
                  f'signature="{signature_b64}"'
    
    return auth_header, payload`,
        verify: `def verify_authorisation_header(auth_header: str, payload: str, 
                                public_key: str) -> tuple[bool, str]:
    """
    Verify ONDC authorization header against payload.
    """
    # Parse authorization header
    key_id, created, expires, signature = parse_auth_header(auth_header)
    
    # Validate timestamp
    current_timestamp = int(time.time())
    if int(created) > current_timestamp or current_timestamp > int(expires):
        return False, "Authorization header expired or not yet valid"
    
    # Hash the exact payload string
    hash_obj = hashlib.blake2b(payload.encode(), digest_size=64)
    digest = base64.b64encode(hash_obj.digest()).decode()
    
    # Create signing string
    signing_string = f"(created): {created}\\n(expires): {expires}\\ndigest: BLAKE-512={digest}"
    
    # Verify signature
    public_key_bytes = base64.b64decode(public_key)
    verify_key = VerifyKey(public_key_bytes)
    signature_bytes = base64.b64decode(signature)
    
    try:
        verify_key.verify(signing_string.encode(), signature_bytes)
        return True, ""
    except Exception:
        return False, "Authorization header verification failed"`,
    },

    go: {
        language: "go",
        label: "Go",
        generate: `func CreateAuthorisationHeader(payload, privateKey, subscriberId, 
    uniqueKeyId string) (string, string, error) {
    currentTime := int(time.Now().Unix())
    ttl := 3600 // 1 hour

    // Hash the exact payload string as provided
    hash := blake2b.Sum512([]byte(payload))
    digest := base64.StdEncoding.EncodeToString(hash[:])

    // Create signing string
    signingString := fmt.Sprintf("(created): %d\\n(expires): %d\\ndigest: BLAKE-512=%s", 
        currentTime, currentTime+ttl, digest)

    // Decode private key
    privateKeyBytes, err := base64.StdEncoding.DecodeString(privateKey)
    if err != nil {
        return "", payload, fmt.Errorf("error decoding private key: %v", err)
    }

    // Handle different private key formats
    var actualPrivateKey []byte
    if len(privateKeyBytes) == 64 {
        actualPrivateKey = ed25519.NewKeyFromSeed(privateKeyBytes[:32])
    } else if len(privateKeyBytes) == 32 {
        actualPrivateKey = ed25519.NewKeyFromSeed(privateKeyBytes)
    }

    // Sign the message
    signature := ed25519.Sign(actualPrivateKey, []byte(signingString))
    signatureB64 := base64.StdEncoding.EncodeToString(signature)

    // Create authorization header
    authHeader := fmt.Sprintf(
        \`Signature keyId="%s|%s|ed25519",algorithm="ed25519",created="%d",\` +
        \`expires="%d",headers="(created) (expires) digest",signature="%s"\`,
        subscriberId, uniqueKeyId, currentTime, currentTime+ttl, signatureB64)

    return authHeader, payload, nil
}`,
        verify: `func VerifyAuthorisationHeader(authHeader, payload, publicKey string) (bool, string) {
    // Parse authorization header
    _, created, expires, signature, err := parseAuthHeader(authHeader)
    if err != nil {
        return false, "error parsing auth header"
    }

    // Validate timestamp
    currentTimestamp := time.Now().Unix()
    createdInt, _ := strconv.ParseInt(created, 10, 64)
    expiresInt, _ := strconv.ParseInt(expires, 10, 64)

    if createdInt > currentTimestamp || currentTimestamp > expiresInt {
        return false, "Authorization header expired or not yet valid"
    }

    // Hash the exact payload string
    hash := blake2b.Sum512([]byte(payload))
    digest := base64.StdEncoding.EncodeToString(hash[:])

    // Create signing string
    signingString := fmt.Sprintf("(created): %s\\n(expires): %s\\ndigest: BLAKE-512=%s", 
        created, expires, digest)

    // Verify signature
    publicKeyBytes, _ := base64.StdEncoding.DecodeString(publicKey)
    signatureBytes, _ := base64.StdEncoding.DecodeString(signature)

    isValid := ed25519.Verify(publicKeyBytes, []byte(signingString), signatureBytes)
    if isValid {
        return true, ""
    }
    return false, "Authorization header verification failed"
}`,
    },

    java: {
        language: "java",
        label: "Java",
        generate: `public static Map<String, Object> createAuthorisationHeader(
        String payload, String privateKey, String subscriberId, String uniqueKeyId) {
    
    long currentTime = Instant.now().getEpochSecond();
    long ttl = 3600; // 1 hour
    
    // Hash the exact payload string using BLAKE2b-512
    Blake2bDigest digest = new Blake2bDigest(512);
    byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
    digest.update(payloadBytes, 0, payloadBytes.length);
    byte[] hash = new byte[64];
    digest.doFinal(hash, 0);
    String digestBase64 = Base64.getEncoder().encodeToString(hash);
    
    // Create signing string
    String signingString = String.format(
        "(created): %d\\n(expires): %d\\ndigest: BLAKE-512=%s",
        currentTime, currentTime + ttl, digestBase64);
    
    // Sign with Ed25519
    byte[] privateKeyBytes = Base64.getDecoder().decode(privateKey);
    Ed25519PrivateKeyParameters privKeyParams = 
        new Ed25519PrivateKeyParameters(privateKeyBytes, 0);
    Ed25519Signer signer = new Ed25519Signer();
    signer.init(true, privKeyParams);
    signer.update(signingString.getBytes(), 0, signingString.length());
    byte[] signature = signer.generateSignature();
    String signatureBase64 = Base64.getEncoder().encodeToString(signature);
    
    // Create authorization header
    String authHeader = String.format(
        "Signature keyId=\\"%s|%s|ed25519\\",algorithm=\\"ed25519\\"," +
        "created=\\"%d\\",expires=\\"%d\\",headers=\\"(created) (expires) digest\\"," +
        "signature=\\"%s\\"",
        subscriberId, uniqueKeyId, currentTime, currentTime + ttl, signatureBase64);
    
    return Map.of("authorization_header", authHeader, "payload", payload);
}`,
        verify: `public static Map<String, Object> verifyAuthorisationHeader(
        String authHeader, String payload, String publicKey) {
    
    // Parse authorization header
    Map<String, String> parsed = parseAuthHeader(authHeader);
    long created = Long.parseLong(parsed.get("created"));
    long expires = Long.parseLong(parsed.get("expires"));
    String signature = parsed.get("signature");
    
    // Validate timestamp
    long currentTime = Instant.now().getEpochSecond();
    if (created > currentTime || currentTime > expires) {
        return Map.of("is_valid", false, 
            "error", "Authorization header expired or not yet valid");
    }
    
    // Hash payload with BLAKE2b-512
    Blake2bDigest digest = new Blake2bDigest(512);
    byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
    digest.update(payloadBytes, 0, payloadBytes.length);
    byte[] hash = new byte[64];
    digest.doFinal(hash, 0);
    String digestBase64 = Base64.getEncoder().encodeToString(hash);
    
    // Create signing string
    String signingString = String.format(
        "(created): %d\\n(expires): %d\\ndigest: BLAKE-512=%s",
        created, expires, digestBase64);
    
    // Verify signature
    byte[] publicKeyBytes = Base64.getDecoder().decode(publicKey);
    byte[] signatureBytes = Base64.getDecoder().decode(signature);
    Ed25519PublicKeyParameters pubKeyParams = 
        new Ed25519PublicKeyParameters(publicKeyBytes, 0);
    Ed25519Signer verifier = new Ed25519Signer();
    verifier.init(false, pubKeyParams);
    verifier.update(signingString.getBytes(), 0, signingString.length());
    
    boolean isValid = verifier.verifySignature(signatureBytes);
    return Map.of("is_valid", isValid);
}`,
    },

    nodejs: {
        language: "javascript",
        label: "Node.js",
        generate: `async function createAuthorisationHeader(payload, privateKey, subscriberId, uniqueKeyId) {
    await sodium.ready;
    
    const created = Math.floor(Date.now() / 1000);
    const expires = created + 3600; // 1 hour TTL

    // Hash the exact payload string using BLAKE2b-512
    const payloadBytes = sodium.from_string(payload);
    const digest = sodium.crypto_generichash(64, payloadBytes);
    const digestBase64 = sodium.to_base64(digest, sodium.base64_variants.ORIGINAL);

    // Create signing string
    const signingString = \`(created): \${created}
(expires): \${expires}
digest: BLAKE-512=\${digestBase64}\`;

    // Sign with Ed25519
    const privateKeyBytes = sodium.from_base64(privateKey, sodium.base64_variants.ORIGINAL);
    const signature = sodium.crypto_sign_detached(
        sodium.from_string(signingString),
        privateKeyBytes
    );
    const signatureBase64 = sodium.to_base64(signature, sodium.base64_variants.ORIGINAL);

    // Create authorization header
    const authHeader = \`Signature keyId="\${subscriberId}|\${uniqueKeyId}|ed25519",\` +
        \`algorithm="ed25519",created="\${created}",expires="\${expires}",\` +
        \`headers="(created) (expires) digest",signature="\${signatureBase64}"\`;

    return { authorization_header: authHeader, payload };
}`,
        verify: `async function verifyAuthorisationHeader(authHeader, payload, publicKey) {
    await sodium.ready;
    
    // Parse authorization header
    const { created, expires, signature } = parseAuthHeader(authHeader);
    
    // Validate timestamp
    const currentTime = Math.floor(Date.now() / 1000);
    if (parseInt(created) > currentTime || currentTime > parseInt(expires)) {
        return { is_valid: false, error: "Authorization header expired or not yet valid" };
    }

    // Hash payload with BLAKE2b-512
    const payloadBytes = sodium.from_string(payload);
    const digest = sodium.crypto_generichash(64, payloadBytes);
    const digestBase64 = sodium.to_base64(digest, sodium.base64_variants.ORIGINAL);

    // Create signing string
    const signingString = \`(created): \${created}
(expires): \${expires}
digest: BLAKE-512=\${digestBase64}\`;

    // Verify signature
    const publicKeyBytes = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
    const signatureBytes = sodium.from_base64(signature, sodium.base64_variants.ORIGINAL);
    
    const isValid = sodium.crypto_sign_verify_detached(
        signatureBytes,
        sodium.from_string(signingString),
        publicKeyBytes
    );

    return { is_valid: isValid };
}`,
    },

    php: {
        language: "php",
        label: "PHP",
        generate: `function createAuthorisationHeader($payload, $privateKey, $subscriberId, $uniqueKeyId) {
    $currentTime = time();
    $ttl = 3600; // 1 hour
    
    // Hash the exact payload string using BLAKE2b-512
    $hash = sodium_crypto_generichash($payload, '', 64);
    $digestBase64 = base64_encode($hash);
    
    // Create signing string
    $signingString = sprintf(
        "(created): %d\\n(expires): %d\\ndigest: BLAKE-512=%s",
        $currentTime, $currentTime + $ttl, $digestBase64
    );
    
    // Sign with Ed25519
    $privateKeyBytes = base64_decode($privateKey);
    $signature = sodium_crypto_sign_detached($signingString, $privateKeyBytes);
    $signatureBase64 = base64_encode($signature);
    
    // Create authorization header
    $authHeader = sprintf(
        'Signature keyId="%s|%s|ed25519",algorithm="ed25519",' .
        'created="%d",expires="%d",headers="(created) (expires) digest",' .
        'signature="%s"',
        $subscriberId, $uniqueKeyId, $currentTime, $currentTime + $ttl, $signatureBase64
    );
    
    return [
        'authorization_header' => $authHeader,
        'payload' => $payload
    ];
}`,
        verify: `function verifyAuthorisationHeader($authHeader, $payload, $publicKey) {
    // Parse authorization header
    $parsed = parseAuthHeader($authHeader);
    $created = (int)$parsed['created'];
    $expires = (int)$parsed['expires'];
    $signature = $parsed['signature'];
    
    // Validate timestamp
    $currentTime = time();
    if ($created > $currentTime || $currentTime > $expires) {
        return ['is_valid' => false, 'error' => 'Authorization header expired'];
    }
    
    // Hash payload with BLAKE2b-512
    $hash = sodium_crypto_generichash($payload, '', 64);
    $digestBase64 = base64_encode($hash);
    
    // Create signing string
    $signingString = sprintf(
        "(created): %d\\n(expires): %d\\ndigest: BLAKE-512=%s",
        $created, $expires, $digestBase64
    );
    
    // Verify signature
    $publicKeyBytes = base64_decode($publicKey);
    $signatureBytes = base64_decode($signature);
    
    $isValid = sodium_crypto_sign_verify_detached(
        $signatureBytes, $signingString, $publicKeyBytes
    );
    
    return ['is_valid' => $isValid];
}`,
    },
};

export type LanguageKey = keyof typeof codeSnippets;
