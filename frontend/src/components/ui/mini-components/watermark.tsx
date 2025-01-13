import React from "react";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";

const Watermark = ({ status }: any) => {
  const isSuccess = status === "success";

  return (
    <div
      className={` flex items-center justify-center p-1 border-2 rounded-full ${
        isSuccess
          ? "text-green-500 bg-green-100 border-green-500"
          : "text-red-500 bg-red-100 border-red-500"
      }`}
    >
      {isSuccess ? <FaCheck /> : <RxCross2 />}
    </div>
  );
};

export default Watermark;
