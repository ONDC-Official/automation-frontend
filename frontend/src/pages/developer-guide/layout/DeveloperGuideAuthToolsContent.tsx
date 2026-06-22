import { FC, useMemo, useState } from "react";
import { BookOpenIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import Header from "@pages/auth-header/Header";
import Tabs from "@pages/auth-header/Tabs";
import Tab from "@pages/auth-header/Tab";
import { TabType, TabConfig } from "@pages/auth-header/types";

const DeveloperGuideAuthToolsContent: FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    const tabs: TabConfig[] = useMemo(
        () => [
            { id: "overview", label: "Overview", icon: <BookOpenIcon className="w-3.5 h-3.5" /> },
            {
                id: "snippets",
                label: "Code Snippets",
                icon: <CodeBracketIcon className="w-3.5 h-3.5" />,
            },
        ],
        []
    );

    return (
        <div className="min-h-full">
            <Header
                tabs={
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        layout="hero"
                    />
                }
            />
            <div className="px-6 md:px-10 py-8">
                <Tab activeTab={activeTab} />
            </div>
        </div>
    );
};

export default DeveloperGuideAuthToolsContent;
