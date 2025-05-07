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
		control,
	} = useForm({ defaultValues });
	const isRequestTriggered = useRef(false);

	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [isError, setIsError] = useState(false);

	const handleSubmitForm = async (data: any) => {
		setIsLoading(true);
		setIsSuccess(false);
		setIsError(false);
		try {
			await onSubmit(data);
			setIsSuccess(true);
		} catch (error: any) {
			setIsError(true);
			console.error(error?.message);
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
				React.cloneElement(child as React.ReactElement, { register, errors })
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
