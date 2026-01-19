import { ReactNode, useState } from "react";

interface TabOption {
    key: string;
    label: string | ReactNode;
}

interface IProps {
    options: TabOption[];
    onSelectOption: (option: string) => void;
    className?: string;
    defaultTab?: string;
    // Legacy props for backward compatibility
    option1?: string;
    option2?: string;
}

const Tabs = ({
    options = [],
    onSelectOption,
    className = "",
    defaultTab,
    // Legacy props
    option1,
    option2,
}: IProps) => {
    // Handle legacy props
    const finalOptions =
        options.length > 0
            ? options
            : option1 && option2
              ? [
                    { key: option1, label: option1 },
                    { key: option2, label: option2 },
                ]
              : [];

    const [activeTab, setActiveTab] = useState(defaultTab || finalOptions[0]?.key || "");

    if (finalOptions.length === 0) {
        return null;
    }

    return (
        <div className={`${className}`} style={{ width: `${finalOptions.length * 8}rem` }}>
            <div className="flex border-b border-gray-300">
                {finalOptions.map((option) => (
                    <button
                        key={option.key}
                        className={`flex-1 text-center font-semibold text-xs px-2 py-1 ${
                            activeTab === option.key
                                ? "border-b-2 border-sky-500 text-sky-500"
                                : "text-gray-500 hover:text-sky-500"
                        }`}
                        onClick={() => {
                            setActiveTab(option.key);
                            onSelectOption(option.key);
                        }}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Tabs;
