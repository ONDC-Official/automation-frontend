import { Card } from "@/components/Shadcn/Card";
import { ConfigCard } from "@pages/user-profile/components/ConfigCard";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import { useConfigFlowDescriptions } from "@pages/user-profile/hooks/useConfigFlowDescriptions";
import type { IScenarioTestConfigSectionProps } from "@pages/user-profile/types";

export const ScenarioTestConfigSection = ({
    configs,
    editingKey,
    onEdit,
    onDelete,
    onLaunch,
}: IScenarioTestConfigSectionProps) => {
    const configCount = Object.keys(configs).length;
    const copy = PROFILE_PAGE_COPY.configs;
    const { descriptions } = useConfigFlowDescriptions(configs);

    return (
        <Card title={copy.listTitle} badgeCount={configCount > 0 ? configCount : undefined}>
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto space-y-3">
                {configCount === 0 ? (
                    <p className="text-body-2 text-text-secondary text-center py-8">
                        No saved configurations yet. Create one to get started.
                    </p>
                ) : (
                    Object.entries(configs).map(([key, config]) => (
                        <ConfigCard
                            key={key}
                            configKey={key}
                            config={config}
                            isEditing={editingKey === key}
                            flowDescription={descriptions[key]}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onLaunch={onLaunch}
                        />
                    ))
                )}
            </div>
        </Card>
    );
};

export default ScenarioTestConfigSection;
