import Loader from "@components/Loader";

const baseButtonClass = `
  flex items-center justify-center px-4 py-2 text-white font-semibold 
  transition-all duration-300 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50
  font-bold
`.trim();

const defaultButtonClass = `
  w-full bg-sky-600 hover:bg-sky-700
  focus:ring-blue-300
`.trim();

const LoadingButton = ({
  type = "submit",
  buttonText,
  disabled = false,
  isLoading = false,
}: {
  type?: "submit" | "reset" | "button";
  buttonText: string;
  disabled?: boolean;
  isLoading?: boolean; // Optional prop
  isSuccess?: boolean; // Optional prop
  isError?: boolean; // Optional prop
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={buttonClass}
      style={{ width: "max-content" }}
    >
      {buttonText}
      {isLoading && <Loader fullPage={true} />}
    </button>
  );
};
export const buttonClass = `${baseButtonClass} ${defaultButtonClass}`;

export default LoadingButton;
