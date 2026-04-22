import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";

import Modal from "@components/Modal";
import { setupKey } from "@utils/secure-key-store";

interface SetupKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SetupKeyModal({ isOpen, onClose, onSuccess }: SetupKeyModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Wipe modal-local state on close so nothing lingers.
            setApiKey("");
            setPassphrase("");
            setConfirm("");
            setError(null);
            setSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);

        if (!apiKey.trim()) {
            setError("API key is required.");
            return;
        }
        if (passphrase.length < 8) {
            setError("Passphrase must be at least 8 characters.");
            return;
        }
        if (passphrase !== confirm) {
            setError("Passphrases do not match.");
            return;
        }

        setSubmitting(true);
        try {
            await setupKey(apiKey.trim(), passphrase);
            toast.success("AI key encrypted and stored locally.");
            onSuccess();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to set up key.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Set up AI key</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Paste your OpenAI-compatible API key. It is encrypted in your browser with
                        your passphrase and never sent to any backend.
                    </p>
                </div>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                    API key
                    <input
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="border border-gray-300 bg-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="sk-..."
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Passphrase
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="border border-gray-300 bg-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="at least 8 characters"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Confirm passphrase
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="border border-gray-300 bg-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <p className="text-xs text-gray-500">
                    There is no passphrase recovery. If you forget it, clear the key and set it up
                    again with a fresh API key.
                </p>
                <div className="flex justify-end gap-2 pt-2">
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
                        {submitting ? "Encrypting..." : "Save key"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
