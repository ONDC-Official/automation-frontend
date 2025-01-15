import Heading from "./mini-components/ondc-gradient-text";
import ToggleButton from "./mini-components/toggle-button";
// import { IoIosArrowDropdownCircle } from "react-icons/io";
import { toast } from "react-toastify";
import { putCacheData } from "../../utils/request-utils";
import { useEffect, useState } from "react";

const keyMapping: any = {
  stopAfterFirstNack: "Stop At Nack",
  timeValidations: "Time Validation",
  protocolValidations: "Protocol Validation",
  useGateway: "Use Gateway",
  headerValidaton: "Header Validation",
  totalDifficulty: "Total Difiiculty",
};

interface DifficultyCache {
  stopAfterFirstNack: boolean;
  timeValidations: boolean;
  protocolValidations: boolean;
  useGateway: boolean;
  headerValidaton: boolean;
  totalDifficulty?: number;
}

interface IPoprs {
  difficulty_cache: DifficultyCache;
  subUrl: string;
}

const DifficultyCards = ({ difficulty_cache, subUrl }: IPoprs) => {
  const [difficultyCache, setDifficultCache] = useState({});

  useEffect(() => {
    if (difficulty_cache?.totalDifficulty) {
      delete difficulty_cache.totalDifficulty;
    }
    setDifficultCache(difficulty_cache);
  }, [difficulty_cache]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateDifficulty();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [difficultyCache]);

  const updateDifficulty = async () => {
    try {
      const response = await putCacheData(
        { difficulty: difficultyCache },
        subUrl
      );
      console.log("diff response", response);
    } catch (e) {
      console.error("error while sending response", e);
      toast.error("Error while updating setting difficulty");
    }
  };

  console.log(':::::::"', difficultyCache);

  return (
    <div className="w-full bg-white/10 backdrop-blur-md rounded-md p-6 shadow-lg flex flex-col gap-4">
      <div className="flex flex-row justify-between">
        <Heading size="text-xl">Difficulty Cache</Heading>
        {/* <button className=" hover:bg-blue-100 text-sky-500 hover:text-blue-600 transition-all duration-300 shadow-sm">
          <IoIosArrowDropdownCircle className="text-3xl" />
        </button> */}
      </div>
      {Object.entries(difficultyCache).length !== 0 && (
        <div className="flex flex-wrap gap-4">
          {Object.entries(difficultyCache).map(([key, value]: any, index: any) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded-md shadow p-2 w-full sm:w-auto sm:flex-1"
            >
              <span className="text-sm font-bold text-sky-700">
                {keyMapping[key]}
              </span>
              <span className="text-sm text-gray-800 font-medium ml-2">
                <ToggleButton
                  initialValue={value}
                  onToggle={(value: boolean) => {
                    setDifficultCache((prevalue: any) => {
                      prevalue[key] = value;
                      return JSON.parse(JSON.stringify(prevalue));
                    });
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DifficultyCards;
