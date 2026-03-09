import { useEffect, useRef } from "react";

export default function MockDynamicForm({
    htmlForm,
    onSubmit,
}: {
    htmlForm: string;
    onSubmit: (formData: Record<string, any>) => void;
}) {
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (formRef.current) {
            formRef.current.innerHTML = htmlForm;

            const formElement = formRef.current.querySelector("form");
            if (formElement) {
                // Inject default styles for unstyled form elements
                injectDefaultStyles(formElement);

                formElement.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const formData = new FormData(formElement);
                    const data: Record<string, any> = {};
                    formData.forEach((value, key) => {
                        data[key] = value;
                    });
                    onSubmit(data);
                });
            }
        }
    }, [htmlForm, onSubmit]);

    return <div ref={formRef} />;
}

function injectDefaultStyles(formElement: HTMLFormElement) {
    // Style the form container itself
    if (!formElement.hasAttribute("style") && !formElement.hasAttribute("class")) {
        Object.assign(formElement.style, {
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
        });
    }

    // Handle submit buttons separately FIRST
    const submitButtons = formElement.querySelectorAll(
        'button[type="submit"], input[type="submit"], button:not([type])'
    );

    submitButtons.forEach((button) => {
        const htmlElement = button as HTMLElement;

        const hasStyles = htmlElement.hasAttribute("style") || htmlElement.hasAttribute("class");

        if (!hasStyles) {
            Object.assign(htmlElement.style, {
                width: "100%",
                padding: "14px 32px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "16px",
                cursor: "pointer",
                border: "none",
                borderRadius: "8px",
                marginTop: "20px",
                boxShadow:
                    "0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)",
                textTransform: "none",
                letterSpacing: "0.02em",
                minHeight: "48px",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                outline: "none",
                transition: "all 0.2s ease-in-out",
                boxSizing: "border-box",
            });

            // Add hover effects
            htmlElement.addEventListener("mouseenter", () => {
                htmlElement.style.backgroundColor = "#1d4ed8";
                htmlElement.style.boxShadow =
                    "0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.2)";
                htmlElement.style.transform = "translateY(-1px)";
            });

            htmlElement.addEventListener("mouseleave", () => {
                htmlElement.style.backgroundColor = "#2563eb";
                htmlElement.style.boxShadow =
                    "0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)";
                htmlElement.style.transform = "translateY(0)";
            });

            htmlElement.addEventListener("mousedown", () => {
                htmlElement.style.transform = "translateY(0)";
                htmlElement.style.boxShadow = "0 2px 4px -1px rgba(37, 99, 235, 0.2)";
            });

            htmlElement.addEventListener("mouseup", () => {
                htmlElement.style.transform = "translateY(-1px)";
                htmlElement.style.boxShadow =
                    "0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.2)";
            });
        }
    });

    // Handle other form elements (excluding submit buttons)
    const formElements = formElement.querySelectorAll(
        'input:not([type="submit"]), textarea, select'
    );

    formElements.forEach((element) => {
        const htmlElement = element as HTMLElement;

        // Check if element has inline styles or classes
        const hasStyles = htmlElement.hasAttribute("style") || htmlElement.hasAttribute("class");

        if (!hasStyles) {
            // Base styles for all form elements
            Object.assign(htmlElement.style, {
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontSize: "15px",
                lineHeight: "1.5",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                outline: "none",
                transition: "all 0.2s ease-in-out",
                boxSizing: "border-box",
            });

            // Type-specific styles
            if (element.tagName === "INPUT") {
                const inputElement = element as HTMLInputElement;

                if (
                    inputElement.type === "text" ||
                    inputElement.type === "email" ||
                    inputElement.type === "password" ||
                    inputElement.type === "tel" ||
                    inputElement.type === "url" ||
                    inputElement.type === "number" ||
                    inputElement.type === "date" ||
                    inputElement.type === "time"
                ) {
                    Object.assign(htmlElement.style, {
                        width: "100%",
                        padding: "10px 14px",
                        marginBottom: "16px",
                        backgroundColor: "#ffffff",
                        color: "#1f2937",
                        border: "1px solid #d1d5db",
                    });
                } else if (inputElement.type === "checkbox" || inputElement.type === "radio") {
                    Object.assign(htmlElement.style, {
                        width: "18px",
                        height: "18px",
                        marginRight: "8px",
                        marginBottom: "0",
                        cursor: "pointer",
                        accentColor: "#2563eb",
                    });
                }
            } else if (element.tagName === "TEXTAREA") {
                Object.assign(htmlElement.style, {
                    width: "100%",
                    padding: "10px 14px",
                    minHeight: "120px",
                    marginBottom: "16px",
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    backgroundColor: "#ffffff",
                    color: "#1f2937",
                    border: "1px solid #d1d5db",
                    resize: "vertical",
                });
            } else if (element.tagName === "SELECT") {
                Object.assign(htmlElement.style, {
                    width: "100%",
                    padding: "10px 14px",
                    marginBottom: "16px",
                    cursor: "pointer",
                    backgroundColor: "#ffffff",
                    color: "#1f2937",
                    border: "1px solid #d1d5db",
                    appearance: "none",
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "36px",
                });
            }

            // Add focus styles
            htmlElement.addEventListener("focus", () => {
                htmlElement.style.borderColor = "#2563eb";
                htmlElement.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
            });

            htmlElement.addEventListener("blur", () => {
                htmlElement.style.borderColor = "#d1d5db";
                htmlElement.style.boxShadow = "none";
            });

            // Placeholder styling for inputs
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                const style = document.createElement("style");
                const uniqueClass = `form-element-${Math.random().toString(36).substr(2, 9)}`;
                htmlElement.classList.add(uniqueClass);

                style.textContent = `
                    .${uniqueClass}::placeholder {
                        color: #9ca3af;
                        opacity: 1;
                    }
                    .${uniqueClass}:disabled {
                        background-color: #f9fafb;
                        color: #6b7280;
                        cursor: not-allowed;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    });

    // Style labels
    const labels = formElement.querySelectorAll("label");
    labels.forEach((label) => {
        if (!label.hasAttribute("style") && !label.hasAttribute("class")) {
            Object.assign(label.style, {
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                letterSpacing: "0.01em",
            });
        }
    });

    // Style fieldsets if present
    const fieldsets = formElement.querySelectorAll("fieldset");
    fieldsets.forEach((fieldset) => {
        if (!fieldset.hasAttribute("style") && !fieldset.hasAttribute("class")) {
            Object.assign((fieldset as HTMLElement).style, {
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
            });
        }
    });

    // Style legends if present
    const legends = formElement.querySelectorAll("legend");
    legends.forEach((legend) => {
        if (!legend.hasAttribute("style") && !legend.hasAttribute("class")) {
            Object.assign((legend as HTMLElement).style, {
                fontSize: "16px",
                fontWeight: "700",
                color: "#111827",
                padding: "0 8px",
            });
        }
    });
}
