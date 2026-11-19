import { Button } from "@components/Shadcn/Button";
import { FieldGroup } from "@components/Shadcn/TextField/field";
import { ComboBox } from "@components/Shadcn/ComboBox";
import { TextField } from "@components/Shadcn/TextField";
import { DomainVersionUsecaseFields } from "@pages/scenario/DomainVersionUsecaseFields";
import { trackSchemaValidationForm } from "@pages/scenario/helpers";
import { SessionFormActions } from "@pages/scenario/SessionFormActions";
import { OrganisationField } from "@pages/scenario/OrganisationField";
import { IManualSessionFormProps } from "@pages/scenario/types";
import { getScenarioDomainLabel } from "@pages/scenario/constants";

export const ManualSessionForm = ({
    domains,
    hasSavedPrefs,
    isSubmitting,
    control,
    handleSubmit,
    watch,
    versionOptions,
    usecaseOptions,
    // configOptions,
    onFormSubmit,
    onBackToSavedConfigs,
    onDomainChange,
    onVersionChange,
    // onConfigChange,
    onCancel,
}: IManualSessionFormProps) => {
    const watchedDomain = watch("domain");
    const watchedVersion = watch("version");

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            {hasSavedPrefs && (
                <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0"
                    onClick={onBackToSavedConfigs}
                >
                    ← Back to saved configs
                </Button>
            )}

            {/* Two fields per row; an odd last field spans the whole row.
                Inputs here are a little taller (44px) than the app default (36px). */}
            <FieldGroup className="grid gap-x-4 gap-y-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2 [&_[data-slot=input-group]]:h-11 [&_[data-slot=input]]:h-11">
                {/* {isLoggedIn ? (
                    <>
                        <ComboBox
                            control={control}
                            name="config"
                            label="Select Configured Domain"
                            options={configOptions}
                            placeholder="Select a configuration"
                            required
                            onValueChange={onConfigChange}
                        />
                        <DomainVersionUsecaseFields
                            control={control}
                            versionOptions={versionOptions}
                            usecaseOptions={usecaseOptions}
                            watchedDomain={watchedDomain}
                            watchedVersion={watchedVersion}
                            onVersionChange={onVersionChange}
                        />
                    </>
                ) : ( */}
                <>
                    <OrganisationField control={control} name="orgId" />
                    <TextField
                        control={control}
                        name="subscriberUrl"
                        label="Enter Subscriber Url"
                        required
                        placeholder="https://example.com"
                        rules={{
                            pattern: {
                                value: /^https?:\/\/.*/i,
                                message: "URL must start with http:// or https://",
                            },
                        }}
                        onValueChange={(value) =>
                            trackSchemaValidationForm("Added subscriber url", value)
                        }
                    />
                    <DomainVersionUsecaseFields
                        control={control}
                        versionOptions={versionOptions}
                        usecaseOptions={usecaseOptions}
                        watchedDomain={watchedDomain}
                        watchedVersion={watchedVersion}
                        domainOptions={domains.map((d) => ({
                            value: d.key,
                            label: getScenarioDomainLabel(d.key),
                        }))}
                        onDomainChange={onDomainChange}
                        onVersionChange={onVersionChange}
                    />
                    <ComboBox
                        control={control}
                        name="npType"
                        label="Select Your Role"
                        options={[
                            { label: "Buyer App (BAP)", value: "BAP" },
                            { label: "Seller App (BPP)", value: "BPP" },
                        ]}
                        placeholder="Select your role"
                        required
                        onValueChange={(value) => trackSchemaValidationForm("Added np type", value)}
                    />
                    {/* No Environment field: sessions use the default, PRE-PRODUCTION (its only option). */}
                </>
                {/* )} */}
            </FieldGroup>

            <SessionFormActions isSubmitting={isSubmitting} onCancel={onCancel} />
        </form>
    );
};
