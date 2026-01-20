import { useState, useMemo } from "react";
import { FaBook, FaCode } from "react-icons/fa";
import Header from "@pages/auth-header/Header";
import Tabs from "@pages/auth-header/Tabs";
import Tab from "@pages/auth-header/Tab";
import { TabType, TabConfig } from "@pages/auth-header/types";

const AuthHeader = () => {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    const tabs: TabConfig[] = useMemo(
        () => [
            { id: "overview", label: "Overview", icon: <FaBook /> },
            { id: "snippets", label: "Code Snippets", icon: <FaCode /> },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Header />

                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                <Tab activeTab={activeTab} />
            </div>
        </div>
    );
};

export default AuthHeader;
