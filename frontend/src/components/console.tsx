import { useState } from "react";
import { FaTerminal } from "react-icons/fa";
import { GoDash } from "react-icons/go";
import { ILogs } from "../interface/index";

interface IProps {
  logs: ILogs[];
}

const Console = ({ logs }: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-2 shadow-md rounded-sm">
      {isOpen ? (
        <div className="w-[350px]">
          <div className="items-center flex justify-end p-1">
            <div
              onClick={() => setIsOpen(false)}
              className="bg-gray-300 rounded-full"
            >
              <GoDash />
            </div>
          </div>

          <div className="bg-black rounded-sm p-2 flex flex-col gap-2 h-[300px] overflow-scroll">
            {logs.length === 0 && (
              <p className="text-white">{`No logs yet.`}</p>
            )}
            {logs.map((log) => (
              <div>
                <p className="text-white">{`> ${log.message}`}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-2" onClick={() => setIsOpen(true)}>
          <FaTerminal />
        </div>
      )}
    </div>
  );
};

export default Console;
