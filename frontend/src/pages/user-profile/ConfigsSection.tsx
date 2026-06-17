import { Spinner } from "@/components/Shadcn/Spinner/spinner";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import { NewConfigForm } from "@pages/user-profile/NewConfigForm";
import { ProfilePageHeader } from "@pages/user-profile/ProfilePageHeader";
import { ScenarioTestConfigSection } from "@pages/user-profile/ScenarioTestConfigSection";
import { useScenarioPreferences } from "@pages/user-profile/hooks/useScenarioPreferences";

export const ConfigsSection = () => {
    const {
        control,
        register,
        errors,
        watch,
        handleSubmit,
        domainOptions,
        versionOptions,
        usecaseOptions,
        handleDomainChange,
        handleVersionChange,
        savedPrefs,
        isSaving,
        isFetching,
        editingKey,
        handleEdit,
        handleCancelEdit,
        onSubmit,
        confirmDelete,
        handleLaunch,
    } = useScenarioPreferences();

    const configCount = Object.keys(savedPrefs).length;
    const copy = PROFILE_PAGE_COPY.configs;

    return (
        <div className="min-w-0 flex-1 min-h-full p-6">
            <ProfilePageHeader
                title={copy.title}
                subtitle={copy.subtitle}
                badgeCount={configCount > 0 ? configCount : undefined}
            />

            {isFetching ? (
                <div className="flex items-center justify-center py-16">
                    <Spinner className="size-8" />
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    <NewConfigForm
                        control={control}
                        register={register}
                        errors={errors}
                        watch={watch}
                        handleSubmit={handleSubmit}
                        onSubmit={onSubmit}
                        editingKey={editingKey}
                        isSaving={isSaving}
                        savedPrefs={savedPrefs}
                        domainOptions={domainOptions}
                        versionOptions={versionOptions}
                        usecaseOptions={usecaseOptions}
                        handleDomainChange={handleDomainChange}
                        handleVersionChange={handleVersionChange}
                        onCancelEdit={handleCancelEdit}
                    />
                    <ScenarioTestConfigSection
                        configs={savedPrefs}
                        editingKey={editingKey}
                        onEdit={handleEdit}
                        onDelete={confirmDelete}
                        onLaunch={handleLaunch}
                    />
                </div>
            )}
        </div>
    );
};

export default ConfigsSection;
