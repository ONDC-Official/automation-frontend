import {
    clearKey as clearSecureKey,
    isConfigured as isKeyConfigured,
    isUnlocked as isKeyUnlocked,
    lock as lockSecureKey,
    onLock as onSecureLock,
} from "@utils/secure-key-store";

export type UnlockGateResult = "unlocked" | "cancelled";

interface PendingGate {
    resolve: (result: UnlockGateResult) => void;
}

export interface AiUnlockGateSnapshot {
    isConfigured: boolean;
    isUnlocked: boolean;
    setupOpen: boolean;
    unlockOpen: boolean;
}

let snapshot: AiUnlockGateSnapshot = {
    isConfigured: false,
    isUnlocked: isKeyUnlocked(),
    setupOpen: false,
    unlockOpen: false,
};

let pendingGate: PendingGate | null = null;
const listeners = new Set<() => void>();
let lockUnsubscribe: (() => void) | null = null;

function emit() {
    listeners.forEach((listener) => listener());
}

function patch(next: Partial<AiUnlockGateSnapshot>) {
    snapshot = { ...snapshot, ...next };
    emit();
}

function resolvePendingGate(result: UnlockGateResult) {
    const pending = pendingGate;
    if (!pending) return;
    pendingGate = null;
    pending.resolve(result);
}

export function subscribeAiUnlockGate(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getAiUnlockGateSnapshot() {
    return snapshot;
}

export async function refreshAiKeyStatus() {
    const configured = await isKeyConfigured();
    patch({
        isConfigured: configured,
        isUnlocked: isKeyUnlocked(),
    });
}

export function ensureAiUnlockGateInitialized() {
    if (lockUnsubscribe) return;
    void refreshAiKeyStatus();
    lockUnsubscribe = onSecureLock(() => patch({ isUnlocked: false }));
}

export function teardownAiUnlockGate() {
    lockUnsubscribe?.();
    lockUnsubscribe = null;
    resolvePendingGate("cancelled");
    patch({ setupOpen: false, unlockOpen: false });
}

export function openAiSetupModal() {
    patch({ unlockOpen: false, setupOpen: true });
}

export function openAiUnlockModal() {
    patch({ setupOpen: false, unlockOpen: true });
}

export function closeAiAuthModals() {
    patch({ setupOpen: false, unlockOpen: false });
    resolvePendingGate("cancelled");
}

export function handleAiSetupSuccess() {
    patch({ setupOpen: false, isConfigured: true, isUnlocked: true });
    resolvePendingGate("unlocked");
}

export function handleAiUnlockSuccess() {
    patch({ unlockOpen: false, isUnlocked: true });
    resolvePendingGate("unlocked");
}

export async function ensureAiUnlocked(): Promise<UnlockGateResult> {
    if (isKeyUnlocked()) {
        return "unlocked";
    }
    const configured = await isKeyConfigured();
    patch({ isConfigured: configured });
    return new Promise<UnlockGateResult>((resolve) => {
        if (pendingGate) {
            pendingGate.resolve("cancelled");
        }
        pendingGate = { resolve };
        if (configured) {
            patch({ unlockOpen: true, setupOpen: false });
        } else {
            patch({ setupOpen: true, unlockOpen: false });
        }
    });
}

export function lockAiSession() {
    lockSecureKey();
    patch({ isUnlocked: false });
}

export async function clearAiKey() {
    await clearSecureKey();
    patch({ isConfigured: false, isUnlocked: false });
}
