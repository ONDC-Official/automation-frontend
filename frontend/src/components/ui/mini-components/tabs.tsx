import { useState } from "react";

interface IProps {
  option1: string;
  option2: string;
  onSelectOption: (option: string) => void;
  className?: string;
}

const Tabs = ({ option1, option2, onSelectOption, className = ""}: IProps) => {
  const [activeTab, setActiveTab] = useState(option1);

  return (
    <div className={`w-52 ${className}`}>
      <div className="flex border-b border-gray-300">
        <button
          className={`flex-1 text-center font-semibold ${
            activeTab === option1
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-blue-500"
          }`}
          onClick={() => {
            setActiveTab(option1);
            onSelectOption(option1);
          }}
        >
          {option1}
        </button>
        <button
          className={`flex-1 text-center font-semibold ${
            activeTab === option2
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-blue-500"
          }`}
          onClick={() => {
            setActiveTab(option2);
            onSelectOption(option2);
          }}
        >
          {option2}
        </button>
      </div>
    </div>
  );
};

export default Tabs;
