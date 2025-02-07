interface IProps {
  title: string;
  subtitle: string;
}

const SecondayHeader = ({ title, subtitle }: IProps) => {
  return (
    <div className="flex flex-col px-4 py-2 w-full bg-white shadow-md">
      <p className="text-l font-bold">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

export default SecondayHeader;
