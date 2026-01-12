import { Switch as AntDSwitch } from "antd";

interface IProps {
  toggleOnText?: string;
  toggleOffText?: string;
  onChange: (isToggle: boolean) => void;
  value?: boolean;
}

const Switch = ({ toggleOffText, toggleOnText, onChange, value }: IProps) => {
  const handleChange = (checked: boolean) => {
    onChange(checked);
  };

  return (
    <div className="flex items-center space-x-2">
      {(toggleOnText || toggleOffText) && (
        <span className="text-gray-700">{value ? toggleOnText : toggleOffText}</span>
      )}
      <AntDSwitch checked={value} onChange={handleChange} />
    </div>
  );
};

export default Switch;
