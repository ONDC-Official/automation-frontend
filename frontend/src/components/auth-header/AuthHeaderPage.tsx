import React, { useState } from "react";
import AlgorithmDocs from "./AlgorithmDocs";
import CodeSnippets from "./CodeSnippets";
import { FaBook, FaCode } from "react-icons/fa";

type TabType = "algorithm" | "snippets";

const AuthHeaderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("algorithm");

  const tabs = [
    { id: "algorithm" as TabType, label: "Overview", icon: <FaBook /> },
    { id: "snippets" as TabType, label: "Code Snippets", icon: <FaCode /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Auth Header Generation & Verification
          </h1>
          <p className="text-gray-600">
            Generate and verify ONDC authorization headers using BLAKE-512 hashing and Ed25519 signatures.
            View implementation code in Python, Go, Java, Node.js, and PHP.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-200"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === "algorithm" && <AlgorithmDocs />}
          {activeTab === "snippets" && <CodeSnippets />}
        </div>
      </div>
    </div>
  );
};

export default AuthHeaderPage;
