import FullPageLoader from "../mini-components/fullpage-loader";

const baseButtonClass = `
  flex items-center justify-center px-4 py-2 text-white font-semibold 
  transition-all duration-300 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50
  font-bold
`.trim();

const defaultButtonClass = `
  w-auto bg-sky-600 hover:bg-sky-700
  focus:ring-blue-300
`.trim();

const LoadingButton = ({
  type = "submit",
  buttonText,
  disabled = false,
  isLoading = false,
  onClick,
  loadingText = "Loading...",
}: {
  type?: "submit" | "reset" | "button";
  buttonText: string;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  loadingText?: string;
}) => {
  if (onClick) {
    return (
      <button
        type={type}
        disabled={disabled || isLoading}
        className={buttonClass}
        onClick={onClick}
      >
        {isLoading ? loadingText : buttonText}
        {isLoading && <FullPageLoader />}
      </button>
    );
  }

  return (
    <button type={type} disabled={disabled || isLoading} className={buttonClass}>
      {buttonText}
      {isLoading && <FullPageLoader />}
    </button>
  );
};
export const buttonClass = `${baseButtonClass} ${defaultButtonClass}`;

export default LoadingButton;
