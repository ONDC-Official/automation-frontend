import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import Spinner from "@/components/Shadcn/Spinner";
import { ConfirmDialog } from "@/components/Shadcn/Dialog";
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
        pendingDeleteKey,
        closeConfirmDelete,
        confirmDeleteAction,
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

            <ConfirmDialog
                open={!!pendingDeleteKey}
                onOpenChange={(open) => !open && closeConfirmDelete()}
                title={
                    <span className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="size-5 text-error-500" />
                        Delete configuration
                    </span>
                }
                description={
                    <>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-text-primary">{pendingDeleteKey}</span>?
                        This action cannot be undone.
                    </>
                }
                confirmText="Delete"
                cancelText="Cancel"
                danger
                onConfirm={confirmDeleteAction}
            />
        </div>
    );
};

export default ConfigsSection;
