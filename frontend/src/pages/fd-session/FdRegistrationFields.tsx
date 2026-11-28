import type { Control } from "react-hook-form";
import { TextField } from "@components/Shadcn/TextField";
import { TextAreaField } from "@components/Shadcn/TextArea";
import type { INewSessionFormValues } from "@pages/scenario/types";

/**
 * What the FD workbench needs to register the participant under test: its Registry identity
 * (subscriber id, unique key id, signing public key) and, for certification, its capability
 * declaration (the spec's Participant object). The subscriber URL is the form's own field.
 */
export const FdRegistrationFields = ({ control }: { control: Control<INewSessionFormValues> }) => (
    <>
        <TextField
            control={control}
            name="fd.subscriberId"
            label="Subscriber ID"
            required
            placeholder="issuer.example.in"
            tooltip="Your app's subscriber_id in the Registry: the one it signs its requests with."
            floatingLabel
        />
        <TextField
            control={control}
            name="fd.ukId"
            label="Unique key ID"
            required
            placeholder="ukId of the signing key"
            tooltip="The unique_key_id of the signing key, as in your Authorization header's keyId."
            floatingLabel
        />
        <TextField
            control={control}
            name="fd.signingPublicKey"
            label="Signing public key"
            required
            placeholder="Ed25519 public key, Base64"
            tooltip="The Ed25519 public key the workbench verifies your signatures with (Base64, as the Registry holds it)."
            floatingLabel
        />
        <div className="sm:col-span-2">
            <TextAreaField
                control={control}
                name="fd.declaration"
                label="Capability declaration (JSON)"
                description="The spec's Participant object: the action groups you support, your licence (issuer) or distribution basis (investor app). Needed for a certification plan; leave empty to only exchange messages."
                placeholder='{"subscriberId": "…", "role": "DEPOSIT_ISSUER", "actionGroups": ["BOOKING"], …}'
                className="min-h-28 font-mono text-xs"
                rules={{
                    validate: (v: unknown) => {
                        const text = typeof v === "string" ? v.trim() : "";
                        if (!text) return true;
                        try {
                            const parsed = JSON.parse(text);
                            return (
                                (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ||
                                "Must be a JSON object"
                            );
                        } catch {
                            return "Not valid JSON";
                        }
                    },
                }}
            />
        </div>
    </>
);
