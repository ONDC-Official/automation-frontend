import React, { useEffect } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import SidebarHeader from "./ui/side-bar-header";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactElement;
}

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, tabs, activeTab, setActiveTab }) => {
  const location = useLocation();
  // Sync activeTab with the URL path
  useEffect(() => {
    const currentTab = tabs.find(tab => `/${tab.id}` === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [location.pathname, tabs, setActiveTab]);

  const navigate = useNavigate();

  return (
    <div
      className={`fixed top-16 left-0 mt-1 h-full bg-white shadow-md transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } flex flex-col`}>
      <SidebarHeader isOpen={isOpen} toggle={toggle} />
      <nav className="flex-1 mt-4">
        <ul className="space-y-2">
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(`/${tab.id}`);
                }}
                className={`relative flex items-center p-3 w-full text-gray-700 hover:bg-sky-200 hover:text-sky-700 transition-all duration-300 ease-in-out rounded-md 
                                ${
                                  activeTab === tab.id
                                    ? "bg-sky-100 text-sky-600 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                                    : "hover:shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                }`}>
                <span
                  className={`transition-transform duration-300 ${
                    activeTab === tab.id ? "scale-110 text-sky-600" : ""
                  }`}>
                  {tab.icon}
                </span>

                {/* Label */}
                {isOpen && (
                  <span
                    className={`ml-3 transition-opacity duration-300 ${
                      activeTab === tab.id ? "opacity-100" : "opacity-80"
                    }`}>
                    {tab.label}
                  </span>
                )}

                {/* Glow Effect */}
                {activeTab === tab.id && <span className="absolute inset-0 rounded-md opacity-30 animate-pulse"></span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {isOpen && <p className="text-gray-500 text-sm">© 2024 ONDC</p>}
      </div>
    </div>
  );
};

export default Sidebar;
