import { TabConfig, TabType } from "@pages/auth-header/types";

interface TabsProps {
  tabs: TabConfig[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const Tabs = ({ tabs, activeTab, setActiveTab }: TabsProps) => (
  <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`tabpanel-${tab.id}`}
        id={`tab-${tab.id}`}
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
);

export default Tabs;
