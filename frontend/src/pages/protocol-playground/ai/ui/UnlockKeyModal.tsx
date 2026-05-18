import { FormEvent, useEffect, useState } from "react";
import { PiShieldStarBold } from "react-icons/pi";

import Popup from "@components/ui/pop-up/pop-up";
import { InvalidPassphraseError, unlockKey } from "@utils/secure-key-store";

interface UnlockKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onSwitchToSetup: () => void;
}

export function UnlockKeyModal({
    isOpen,
    onClose,
    onSuccess,
    onSwitchToSetup,
}: UnlockKeyModalProps) {
    const [passphrase, setPassphrase] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setPassphrase("");
            setError(null);
            setSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);

        if (!passphrase) {
            setError("Passphrase is required.");
            return;
        }

        setSubmitting(true);
        try {
            await unlockKey(passphrase);
            onSuccess();
        } catch (err) {
            if (err instanceof InvalidPassphraseError) {
                setError("Invalid passphrase. Try again.");
            } else {
                const message = err instanceof Error ? err.message : "Failed to unlock.";
                setError(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Popup isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pr-8">
                <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm shrink-0">
                        <PiShieldStarBold className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Unlock Protocol Guardian
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Enter the passphrase you set up on this device. The key is
                            decrypted in memory only — nothing is written back.
                        </p>
                    </div>
                </div>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Passphrase
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="border bg-white border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        autoFocus
                    />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onSwitchToSetup}
                        className="text-xs text-sky-600 hover:underline"
                    >
                        Forgot passphrase? Reset and set up a new key.
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                            {submitting ? "Unlocking..." : "Unlock"}
                        </button>
                    </div>
                </div>
            </form>
        </Popup>
    );
}
