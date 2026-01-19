import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import LoadingButton from "./loading-button";

const GenericForm = ({
    defaultValues,
    children,
    onSubmit,
    className,
    triggerSubmit = false,
}: {
    defaultValues?: any;
    children: React.ReactNode;
    onSubmit: (data: any) => Promise<void>;
    className?: string;
    triggerSubmit?: boolean;
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm({ defaultValues });
    const isRequestTriggered = useRef(false);

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitForm = async (data: any) => {
        setIsLoading(true);

        try {
            await onSubmit(data);
        } catch (error: unknown) {
            console.error((error as Error)?.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (triggerSubmit && !isRequestTriggered.current) {
            isRequestTriggered.current = true;
            handleSubmit(handleSubmitForm)();
        }
    }, []);

    return (
        <form
            onSubmit={handleSubmit(handleSubmitForm)} // Use handleSubmit to manage form submission
            className={className}
        >
            {React.Children.map(children, (child) =>
                React.cloneElement(child as React.ReactElement, { register, errors, setValue })
            )}
            <LoadingButton type="submit" buttonText="Submit" isLoading={isLoading} />
        </form>
    );
};

export default GenericForm;
