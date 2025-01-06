import { useState } from "react";

interface IPorps {
  toggleOnText: string;
  toggleOffText: string;
  onToggle: () => void;
}

function ToggleButton({ toggleOffText, toggleOnText, onToggle }: IPorps) {
  const [isToggled, setIsToggled] = useState(false);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-700">
        {isToggled ? toggleOnText : toggleOffText}
      </span>
      <button
        onClick={() => {
          setIsToggled(!isToggled);
          onToggle(!isToggled);
        }}
        className={`w-10 h-6 flex items-center rounded-full p-1 ${
          isToggled ? "bg-blue-500" : "bg-gray-300"
        } transition-colors`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform ${
            isToggled ? "translate-x-4" : "translate-x-0"
          } transition-transform`}
        ></div>
      </button>
    </div>
  );
}

export default ToggleButton;
