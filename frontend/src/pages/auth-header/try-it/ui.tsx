// Minimal Button / Input / CodeBlock for the Try It tab, styled like the rest of Auth Tools.
import { ButtonHTMLAttributes, FC, InputHTMLAttributes } from "react";
import { useClipboard } from "@hooks/useClipboard";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" };

export const Button: FC<ButtonProps> = ({
    variant = "default",
    className = "",
    type,
    ...props
}) => (
    <button
        type={type ?? "button"}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            variant === "outline"
                ? "border border-sky-600 bg-white text-sky-700 hover:bg-sky-50"
                : "bg-sky-600 text-white hover:bg-sky-700"
        } ${className}`}
        {...props}
    />
);

export const Input: FC<InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
    <input
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 ${className}`}
        {...props}
    />
);

export const CodeBlock: FC<{ code: string; language?: string; wrap?: boolean }> = ({
    code,
    wrap,
}) => {
    const { copied, copyToClipboard } = useClipboard();
    return (
        <div className="relative rounded-lg bg-gray-900">
            <button
                type="button"
                onClick={() => copyToClipboard(code)}
                className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-100 hover:bg-gray-600"
            >
                {copied ? "Copied" : "Copy"}
            </button>
            <pre
                className={`overflow-x-auto p-4 pr-16 font-mono text-sm text-green-400 ${
                    wrap ? "whitespace-pre-wrap break-all" : ""
                }`}
            >
                {code}
            </pre>
        </div>
    );
};

export default Button;
