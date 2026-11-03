import { FC, ReactNode, useMemo, useState } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";
import LoadingButton from "@components/ui/forms/loading-button";
import { inputClass, labelClass } from "@components/ui/forms/inputClass";
import { SegmentedTabs } from "@components/ui/SegmentedTabs";
import { useClipboard } from "@hooks/useClipboard";
import {
    TEST_VECTOR,
    createAuthorizationHeader,
    generateDemoKeyPair,
    parseAuthorizationHeader,
    payloadWarnings,
    publicKeyFromPrivate,
    verifyAuthorizationHeader,
    type CreateHeaderResult,
    type VerifyResult,
} from "@pages/auth-header/playground/authHeaderCrypto";

type Mode = "build" | "verify" | "break";

const MODE_TABS: { id: Mode; label: string }[] = [
    { id: "build", label: "Build a header" },
    { id: "verify", label: "Verify a header" },
    { id: "break", label: "Break it" },
];

const cardClass = "bg-white border border-gray-200 rounded-xl p-6";

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Read-only value box, same look as the Overview tab's header format examples. */
const ValueBox: FC<{ value: string }> = ({ value }) => (
    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap break-all">
            {value}
        </pre>
    </div>
);

const Field: FC<{ label: string; hint?: string; children: ReactNode }> = ({
    label,
    hint,
    children,
}) => (
    <label className="block space-y-1">
        <span className={labelClass}>{label}</span>
        {children}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </label>
);

const Step: FC<{ n: number; title: string; note: string; children: ReactNode }> = ({
    n,
    title,
    note,
    children,
}) => (
    <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
            {n}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
            <div>
                <h4 className="font-semibold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600">{note}</p>
            </div>
            {children}
        </div>
    </div>
);

const ResultBanner: FC<{ result: VerifyResult }> = ({ result }) => (
    <div
        className={`rounded-lg border p-4 text-sm font-semibold ${
            result.valid
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-red-300 bg-red-50 text-red-700"
        }`}
        role="status"
    >
        {result.valid ? "✓ Valid — signature verified." : `✗ Invalid — ${result.reason}`}
    </div>
);

const VerifySteps: FC<{ result: VerifyResult }> = ({ result }) => (
    <ol className="space-y-2">
        {result.steps.map((step) => (
            <li key={step.label} className="flex gap-3 text-sm">
                <span className={step.status === "pass" ? "text-green-700" : "text-red-700"}>
                    {step.status === "pass" ? "✓" : "✗"}
                </span>
                <span className="min-w-0">
                    <span className="font-semibold text-gray-900">{step.label}</span>
                    <span className="block whitespace-pre-wrap break-all font-mono text-xs text-gray-600">
                        {step.detail}
                    </span>
                </span>
            </li>
        ))}
    </ol>
);

/** A change applied to a freshly signed header + payload to show what breaks verification. */
interface BreakScenario {
    id: string;
    label: string;
    apply: (ctx: { header: string; payload: string; publicKey: string }) => {
        header: string;
        payload: string;
        publicKey: string;
    };
}

const prettyPrint = (payload: string) => {
    try {
        return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
        return payload + " ";
    }
};

const BREAK_SCENARIOS: BreakScenario[] = [
    { id: "none", label: "No change", apply: (c) => c },
    {
        id: "pretty",
        label: "Pretty-print payload",
        apply: (c) => ({ ...c, payload: prettyPrint(c.payload) }),
    },
    {
        id: "value",
        label: "Change one value",
        apply: (c) => ({
            ...c,
            payload: c.payload.replace(/"search"|"select"|"init"|"confirm"/, '"status"'),
        }),
    },
    {
        id: "reorder",
        label: "Reorder keys",
        apply: (c) => {
            try {
                const obj = JSON.parse(c.payload);
                const reordered = Object.fromEntries(Object.entries(obj).reverse());
                return { ...c, payload: JSON.stringify(reordered) };
            } catch {
                return c;
            }
        },
    },
    {
        id: "newline",
        label: "Trailing newline",
        apply: (c) => ({ ...c, payload: c.payload + "\n" }),
    },
    {
        id: "wrong-key",
        label: "Different public key",
        apply: (c) => ({ ...c, publicKey: generateDemoKeyPair().publicKey }),
    },
    { id: "expired", label: "After expiry", apply: (c) => c },
];

const AuthHeaderPlayground: FC = () => {
    const { copied, copyToClipboard } = useClipboard();
    const [mode, setMode] = useState<Mode>("build");

    // Build inputs
    const [payload, setPayload] = useState<string>(TEST_VECTOR.payload);
    const [subscriberId, setSubscriberId] = useState<string>(TEST_VECTOR.subscriberId);
    const [uniqueKeyId, setUniqueKeyId] = useState<string>(TEST_VECTOR.uniqueKeyId);
    const [privateKey, setPrivateKey] = useState<string>("");
    const [created, setCreated] = useState<string>(String(nowSeconds()));
    const [ttl, setTtl] = useState<string>("3600");

    // Verify inputs
    const [verifyHeader, setVerifyHeader] = useState("");
    const [verifyPayload, setVerifyPayload] = useState("");
    const [verifyPublicKey, setVerifyPublicKey] = useState("");
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [verifyAt, setVerifyAt] = useState<"now" | "created">("now");

    // Break it
    const [scenarioId, setScenarioId] = useState("none");

    const build = useMemo((): { result?: CreateHeaderResult; error?: string } => {
        if (!privateKey.trim())
            return { error: "Enter a private key or generate a demo key pair." };
        const createdNum = Number(created);
        const ttlNum = Number(ttl);
        if (!Number.isInteger(createdNum) || !Number.isInteger(ttlNum) || ttlNum < 0) {
            return { error: "created and TTL must be whole numbers of seconds." };
        }
        try {
            return {
                result: createAuthorizationHeader({
                    payload,
                    privateKey,
                    subscriberId,
                    uniqueKeyId,
                    created: createdNum,
                    ttl: ttlNum,
                }),
            };
        } catch (e) {
            return { error: (e as Error).message };
        }
    }, [payload, privateKey, subscriberId, uniqueKeyId, created, ttl]);

    const warnings = useMemo(() => payloadWarnings(payload), [payload]);
    const builtWithVector =
        build.result &&
        privateKey === TEST_VECTOR.privateKey &&
        payload === TEST_VECTOR.payload &&
        Number(created) === TEST_VECTOR.created &&
        Number(ttl) === TEST_VECTOR.ttl;
    const matchesVector =
        build.result?.digestBase64 === TEST_VECTOR.expectedDigest &&
        build.result?.signatureBase64 === TEST_VECTOR.expectedSignature;

    const breakResult = useMemo(() => {
        if (!build.result) return null;
        const scenario = BREAK_SCENARIOS.find((s) => s.id === scenarioId) ?? BREAK_SCENARIOS[0];
        const changed = scenario.apply({
            header: build.result.header,
            payload,
            publicKey: build.result.publicKey,
        });
        // Verify relative to the signing time so the demo also works with the fixed test-vector timestamp.
        const at = scenario.id === "expired" ? build.result.expires + 3600 : build.result.created;
        return {
            changed,
            result: verifyAuthorizationHeader(
                changed.header,
                changed.payload,
                changed.publicKey,
                at
            ),
        };
    }, [build.result, payload, scenarioId]);

    const loadTestVector = () => {
        setPayload(TEST_VECTOR.payload);
        setSubscriberId(TEST_VECTOR.subscriberId);
        setUniqueKeyId(TEST_VECTOR.uniqueKeyId);
        setPrivateKey(TEST_VECTOR.privateKey);
        setCreated(String(TEST_VECTOR.created));
        setTtl(String(TEST_VECTOR.ttl));
    };

    const sendToVerify = () => {
        if (!build.result) return;
        setVerifyHeader(build.result.header);
        setVerifyPayload(payload);
        setVerifyPublicKey(build.result.publicKey);
        setVerifyResult(null);
        setMode("verify");
    };

    const runVerify = () => {
        const headerCreated = Number(parseAuthorizationHeader(verifyHeader).created);
        const at =
            verifyAt === "created" && Number.isInteger(headerCreated)
                ? headerCreated
                : nowSeconds();
        setVerifyResult(
            verifyAuthorizationHeader(verifyHeader, verifyPayload, verifyPublicKey, at)
        );
    };

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-gray-700">
                Everything on this page runs in your browser — nothing is sent to a server. Use demo
                keys only; <strong>never paste a production private key.</strong>
            </div>

            <SegmentedTabs<Mode> tabs={MODE_TABS} active={mode} onChange={setMode} />

            {mode === "build" && (
                <>
                    <div className={`${cardClass} space-y-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-xl font-bold text-gray-900">Inputs</h3>
                            <div className="flex flex-wrap gap-2">
                                <LoadingButton
                                    type="button"
                                    buttonText="Generate demo key pair"
                                    onClick={() => setPrivateKey(generateDemoKeyPair().privateKey)}
                                />
                                <LoadingButton
                                    type="button"
                                    buttonText="Load test vector"
                                    onClick={loadTestVector}
                                />
                            </div>
                        </div>
                        <Field label="Payload (raw JSON, signed exactly as typed)">
                            <textarea
                                className={`${inputClass} min-h-32 font-mono`}
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                spellCheck={false}
                            />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Subscriber ID">
                                <input
                                    className={inputClass}
                                    value={subscriberId}
                                    onChange={(e) => setSubscriberId(e.target.value)}
                                />
                            </Field>
                            <Field label="Unique key ID">
                                <input
                                    className={inputClass}
                                    value={uniqueKeyId}
                                    onChange={(e) => setUniqueKeyId(e.target.value)}
                                />
                            </Field>
                        </div>
                        <Field
                            label="Ed25519 private key (Base64)"
                            hint="32-byte seed or 64-byte key (seed + public key)."
                        >
                            <input
                                className={`${inputClass} font-mono`}
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                placeholder="Generate a demo key pair or load the test vector"
                            />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="created (Unix seconds)">
                                <div className="flex gap-2">
                                    <input
                                        className={inputClass}
                                        value={created}
                                        onChange={(e) => setCreated(e.target.value)}
                                    />
                                    <LoadingButton
                                        type="button"
                                        buttonText="Now"
                                        onClick={() => setCreated(String(nowSeconds()))}
                                    />
                                </div>
                            </Field>
                            <Field label="TTL (seconds)">
                                <input
                                    className={inputClass}
                                    value={ttl}
                                    onChange={(e) => setTtl(e.target.value)}
                                />
                            </Field>
                        </div>
                    </div>

                    <div className={`${cardClass} space-y-6`}>
                        <h3 className="text-xl font-bold text-gray-900">How the header is built</h3>
                        {build.error && (
                            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {build.error}
                            </p>
                        )}
                        {build.result && (
                            <>
                                <Step
                                    n={1}
                                    title="Payload bytes"
                                    note="The exact UTF-8 bytes of the payload are hashed — any change produces a different digest."
                                >
                                    <p className="text-sm text-gray-900">
                                        {build.result.payloadBytes} bytes
                                    </p>
                                    {warnings.map((w) => (
                                        <p
                                            key={w.id}
                                            className="text-sm font-semibold text-amber-700"
                                        >
                                            ⚠ {w.message}
                                        </p>
                                    ))}
                                </Step>
                                <Step
                                    n={2}
                                    title="BLAKE2b-512 digest"
                                    note="64-byte hash of the payload, Base64 encoded (standard Base64, not URL-safe)."
                                >
                                    <ValueBox value={build.result.digestBase64} />
                                    <p className="break-all font-mono text-xs text-gray-600">
                                        hex: {build.result.digestHex}
                                    </p>
                                </Step>
                                <Step
                                    n={3}
                                    title="Signing string"
                                    note="Three lines joined with \n (LF). expires = created + TTL."
                                >
                                    <ValueBox value={build.result.signingString} />
                                </Step>
                                <Step
                                    n={4}
                                    title="Ed25519 signature"
                                    note="The signing string is signed with the private key; the 64-byte signature is Base64 encoded."
                                >
                                    <ValueBox value={build.result.signatureBase64} />
                                </Step>
                                <Step
                                    n={5}
                                    title="Authorization header"
                                    note="Put this in the Authorization header of the request."
                                >
                                    <ValueBox value={build.result.header} />
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(build.result!.header)}
                                            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-100 text-sm transition-colors"
                                        >
                                            {copied ? (
                                                <>
                                                    <FaCheck className="text-green-400" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <FaCopy />
                                                    Copy header
                                                </>
                                            )}
                                        </button>
                                        <LoadingButton
                                            type="button"
                                            buttonText="Verify this header →"
                                            onClick={sendToVerify}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Matching public key:{" "}
                                        <span className="break-all font-mono">
                                            {build.result.publicKey}
                                        </span>
                                    </p>
                                </Step>
                                {builtWithVector && (
                                    <p
                                        className={`rounded-lg p-3 text-sm font-semibold ${
                                            matchesVector
                                                ? "bg-green-50 text-green-700"
                                                : "bg-red-50 text-red-700"
                                        }`}
                                    >
                                        {matchesVector
                                            ? "✓ Output matches the published test vector. Your own implementation should produce exactly these values for the same inputs."
                                            : "✗ Output does not match the published test vector."}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {mode === "verify" && (
                <div className={`${cardClass} space-y-4`}>
                    <h3 className="text-xl font-bold text-gray-900">Verify a header</h3>
                    <p className="text-sm text-gray-600">
                        In production, the public key is fetched from the Registry using the
                        subscriber ID and unique key ID in <code>keyId</code>.
                    </p>
                    <Field label="Authorization header">
                        <textarea
                            className={`${inputClass} min-h-24 font-mono`}
                            value={verifyHeader}
                            onChange={(e) => setVerifyHeader(e.target.value)}
                            spellCheck={false}
                        />
                    </Field>
                    <Field label="Payload (exactly as received)">
                        <textarea
                            className={`${inputClass} min-h-24 font-mono`}
                            value={verifyPayload}
                            onChange={(e) => setVerifyPayload(e.target.value)}
                            spellCheck={false}
                        />
                    </Field>
                    <Field label="Signer's Ed25519 public key (Base64)">
                        <input
                            className={`${inputClass} font-mono`}
                            value={verifyPublicKey}
                            onChange={(e) => setVerifyPublicKey(e.target.value)}
                        />
                    </Field>
                    <fieldset className="space-y-1">
                        <legend className={labelClass}>Check timestamps against</legend>
                        <label className="mr-6 inline-flex items-center gap-2 text-sm text-gray-900">
                            <input
                                type="radio"
                                name="verify-at"
                                checked={verifyAt === "now"}
                                onChange={() => setVerifyAt("now")}
                            />
                            Now (real verification)
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-900">
                            <input
                                type="radio"
                                name="verify-at"
                                checked={verifyAt === "created"}
                                onChange={() => setVerifyAt("created")}
                            />
                            The header's created time (to check the signature of an old header, e.g.
                            the test vector)
                        </label>
                    </fieldset>
                    <LoadingButton type="button" buttonText="Verify" onClick={runVerify} />
                    {verifyResult && (
                        <div className="space-y-3">
                            <ResultBanner result={verifyResult} />
                            <VerifySteps result={verifyResult} />
                        </div>
                    )}
                </div>
            )}

            {mode === "break" && (
                <div className={`${cardClass} space-y-4`}>
                    <h3 className="text-xl font-bold text-gray-900">Break it</h3>
                    <p className="text-sm text-gray-600">
                        Takes the header built in "Build a header", applies one change, and verifies
                        again — to show what invalidates a signature.
                    </p>
                    {!build.result ? (
                        <p className="text-sm text-amber-700">Build a header first.</p>
                    ) : (
                        <>
                            <SegmentedTabs
                                className="flex-wrap"
                                tabs={BREAK_SCENARIOS.map(({ id, label }) => ({ id, label }))}
                                active={scenarioId}
                                onChange={setScenarioId}
                            />
                            {breakResult && (
                                <div className="space-y-3">
                                    <ResultBanner result={breakResult.result} />
                                    <VerifySteps result={breakResult.result} />
                                    <details className="space-y-2">
                                        <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                                            Payload that was verified
                                        </summary>
                                        <ValueBox value={breakResult.changed.payload} />
                                    </details>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className={`${cardClass} space-y-3`}>
                <h3 className="text-xl font-bold text-gray-900">Test vector</h3>
                <p className="text-sm text-gray-600">
                    Fixed inputs with known output, cross-checked with PyNaCl and libsodium. Run
                    your implementation with these inputs — it must produce exactly this digest and
                    signature. The key is public and for testing only; never register it.
                </p>
                <ValueBox
                    value={JSON.stringify(
                        {
                            private_key_seed: TEST_VECTOR.privateKey,
                            public_key: TEST_VECTOR.publicKey,
                            subscriber_id: TEST_VECTOR.subscriberId,
                            unique_key_id: TEST_VECTOR.uniqueKeyId,
                            payload: TEST_VECTOR.payload,
                            created: TEST_VECTOR.created,
                            expires: TEST_VECTOR.created + TEST_VECTOR.ttl,
                            digest: TEST_VECTOR.expectedDigest,
                            signature: TEST_VECTOR.expectedSignature,
                        },
                        null,
                        2
                    )}
                />
                <p className="text-xs text-gray-600">
                    Derived public key check:{" "}
                    {publicKeyFromPrivate(TEST_VECTOR.privateKey) === TEST_VECTOR.publicKey
                        ? "✓"
                        : "✗"}
                </p>
            </div>
        </div>
    );
};

export default AuthHeaderPlayground;
