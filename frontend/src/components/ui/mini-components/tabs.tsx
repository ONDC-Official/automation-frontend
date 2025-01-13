import { useState } from "react";

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("sync");

  return (
    <div className="w-52">
      <div className="flex border-b border-gray-300">
        <button
          className={`flex-1 text-center font-semibold ${
            activeTab === "sync"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("sync")}
        >
          Sync
        </button>
        <button
          className={`flex-1 text-center font-semibold ${
            activeTab === "async"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("async")}
        >
          Async
        </button>
      </div>
    </div>
  );
};

export default Tabs;
