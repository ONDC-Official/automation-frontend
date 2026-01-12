import React, { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import LoadingButton from "@components/LoadingButton";

const GenericForm = ({
  defaultValues,
  children,
  onSubmit,
  className,
  triggerSubmit = false,
}: {
  defaultValues?: Record<string, unknown>;
  children: React.ReactNode;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmitForm = useCallback(
    async (data: Record<string, unknown>) => {
      setIsLoading(true);
      setIsSuccess(false);
      setIsError(false);
      try {
        await onSubmit(data);
        setIsSuccess(true);
      } catch (error: unknown) {
        setIsError(true);
        const errorMessage =
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unknown error";
        console.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit]
  );

  useEffect(() => {
    if (triggerSubmit && !isRequestTriggered.current) {
      isRequestTriggered.current = true;
      handleSubmit(handleSubmitForm)();
    }
  }, [triggerSubmit, handleSubmit, handleSubmitForm]);

  return (
    <form
      onSubmit={handleSubmit(handleSubmitForm)} // Use handleSubmit to manage form submission
      className={className}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, { register, errors, setValue })
      )}
      <LoadingButton
        type="submit"
        buttonText="Submit"
        isLoading={isLoading}
        isSuccess={isSuccess}
        isError={isError}
      />
    </form>
  );
};

export default GenericForm;
