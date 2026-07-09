import { FormEvent, useEffect, useState } from "react";
import { PiShieldStarBold } from "react-icons/pi";
import { toast } from "sonner";

import FormFlowDialog from "@components/Shadcn/Dialog/form-flow-dialog";
import { Button } from "@/components/Shadcn/Button";
import { Input } from "@components/Shadcn/Input";
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
        <FormFlowDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
            >
                <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-linear-to-br from-sky-500 to-indigo-600 text-white shadow-xs shrink-0">
                        <PiShieldStarBold className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Set up Protocol Guardian
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Paste your OpenAI-compatible API key. It is encrypted in your browser
                            with your passphrase and never sent to any backend.
                        </p>
                    </div>
                </div>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                    API key
                    <Input
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-white rounded px-3 py-2 text-sm"
                        placeholder="sk-..."
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Passphrase
                    <Input
                        type="password"
                        autoComplete="new-password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="bg-white rounded px-3 py-2 text-sm"
                        placeholder="at least 8 characters"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Confirm passphrase
                    <Input
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="bg-white rounded px-3 py-2 text-sm"
                    />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <p className="text-xs text-gray-500">
                    There is no passphrase recovery. If you forget it, clear the key and set it up
                    again with a fresh API key.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="ghost"
                        disabled={submitting}
                        className="px-4 py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                        {submitting ? "Encrypting..." : "Save key"}
                    </Button>
                </div>
            </form>
        </FormFlowDialog>
    );
}
