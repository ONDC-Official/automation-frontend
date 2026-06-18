import { useState } from "react";
import { PlayIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/Shadcn/TextField/field";
import { Input } from "@/components/Shadcn/TextField/input";

const ROLE_OPTIONS = ["BAP", "BPP"] as const;

export interface ICreateFlowSessionFormData {
    subscriberUrl: string;
    role: (typeof ROLE_OPTIONS)[number];
}

interface ICreateFlowSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ICreateFlowSessionFormData) => Promise<void>;
}

export const CreateFlowSessionModal = ({
    isOpen,
    onClose,
    onSubmit,
}: ICreateFlowSessionModalProps) => {
    const [subscriberUrl, setSubscriberUrl] = useState("");
    const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("BAP");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSubscriberUrl("");
            setRole("BAP");
            onClose();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit({ subscriberUrl: subscriberUrl.trim(), role });
            setSubscriberUrl("");
            setRole("BAP");
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-w-lg flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="flex flex-row items-center gap-2.5 border-b border-border-default px-6 py-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-light-active bg-brand-light dark:bg-surface-muted">
                        <PlayIcon className="size-5 text-brand-normal" />
                    </div>
                    <div className="min-w-0">
                        <DialogTitle>Create Live Flow Session</DialogTitle>
                        <DialogDescription className="mt-0.5">
                            Enter details to create a live session.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex flex-col gap-4 px-6 py-5">
                    <Field>
                        <FieldLabel htmlFor="subscriber-url">
                            Your Subscriber URL
                            <span className="text-destructive">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="subscriber-url"
                                type="url"
                                placeholder="https://example.com/subscriber"
                                value={subscriberUrl}
                                onChange={(e) => setSubscriberUrl(e.target.value)}
                            />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="session-role">
                            Your Role
                            <span className="text-destructive">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Combobox
                                items={[...ROLE_OPTIONS]}
                                value={role}
                                onValueChange={(value) =>
                                    setRole((value as (typeof ROLE_OPTIONS)[number]) ?? "BAP")
                                }
                            >
                                <ComboboxInput
                                    id="session-role"
                                    placeholder="Select role"
                                    className="w-full"
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>No roles found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(item) => (
                                            <ComboboxItem key={item} value={item}>
                                                {item}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </FieldContent>
                    </Field>
                </div>

                <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} isLoading={isSubmitting}>
                        Create Session
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
