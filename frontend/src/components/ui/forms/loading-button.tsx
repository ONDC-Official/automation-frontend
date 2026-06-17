//TODO: Remove this component when seller onboarding revamp and refactor is complete
import { Button } from "@/components/Shadcn/Button/button";
import { Spinner } from "@/components/Shadcn/Spinner/spinner";

interface ILoadingButtonProps {
    type?: "submit" | "reset" | "button";
    buttonText: string;
    disabled?: boolean;
    isLoading?: boolean;
    onClick?: () => void;
    loadingText?: string;
}

const buttonClass =
    "flex items-center justify-center gap-2 px-4 py-2 font-bold text-white rounded transition-all duration-300 w-auto bg-sky-600 hover:bg-sky-700 focus:outline-hidden focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50";

const LoadingButton = ({
    type = "submit",
    buttonText,
    disabled = false,
    isLoading = false,
    onClick,
    loadingText = "Loading...",
}: ILoadingButtonProps) => (
    <Button
        type={type}
        disabled={disabled || isLoading}
        className={buttonClass}
        onClick={onClick}
    >
        {isLoading ? (
            <>
                <Spinner className="size-4" />
                {loadingText}
            </>
        ) : (
            buttonText
        )}
    </Button>
);

export { buttonClass };
export default LoadingButton;
