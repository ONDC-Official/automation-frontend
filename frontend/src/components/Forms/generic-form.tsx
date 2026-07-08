import { Children, cloneElement, useEffect, useRef, useState, type ReactElement } from "react";
import { DefaultValues, FieldValues, useForm } from "react-hook-form";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";

interface IGenericFormProps<T extends FieldValues> {
    defaultValues?: DefaultValues<T>;
    children: React.ReactNode;
    onSubmit: (data: T) => Promise<void>;
    className?: string;
    triggerSubmit?: boolean;
    submitAlign?: "left" | "right";
}

const GenericForm = <T extends FieldValues = FieldValues>({
    defaultValues,
    children,
    onSubmit,
    className,
    triggerSubmit = false,
    submitAlign = "right",
}: IGenericFormProps<T>) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
    } = useForm({ defaultValues });
    const isRequestTriggered = useRef(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitForm = async (data: T) => {
        setIsLoading(true);
        try {
            await onSubmit(data);
        } catch (error: unknown) {
            console.error((error as Error)?.message);
        } finally {
            setIsLoading(false);
        }
    };

    const submit = handleSubmit(handleSubmitForm);

    useEffect(() => {
        if (triggerSubmit && !isRequestTriggered.current) {
            isRequestTriggered.current = true;
            submit();
        }
    }, [triggerSubmit, submit]);

    return (
        <FormDialogShell
            onSubmit={submit}
            className={className}
            footer={
                <div className={submitAlign === "right" ? "flex w-full justify-end" : undefined}>
                    <Button type="submit" isLoading={isLoading} variant="default">
                        Submit
                    </Button>
                </div>
            }
        >
            {Children.map(children, (child) =>
                cloneElement(child as ReactElement<Record<string, unknown>>, {
                    register,
                    control,
                    errors,
                    setValue,
                })
            )}
        </FormDialogShell>
    );
};

export default GenericForm;
