import { Button } from "@/components/Shadcn/Button/button";
import { FieldGroup } from "@/components/Shadcn/TextField/field";
import { ComboBox } from "@/components/Shadcn/ComboBox";
import { TextField } from "@/components/Shadcn/TextField";
import { DomainVersionUsecaseFields } from "@/pages/scenario/DomainVersionUsecaseFields";
import { trackSchemaValidationForm } from "@/pages/scenario/helpers";
import { SessionFormActions } from "@/pages/scenario/SessionFormActions";
import { IManualSessionFormProps } from "@/pages/scenario/types";

export const ManualSessionForm = ({
    domains,
    hasSavedPrefs,
    isLoggedIn,
    isSubmitting,
    control,
    register,
    errors,
    handleSubmit,
    watch,
    versionOptions,
    usecaseOptions,
    configOptions,
    onFormSubmit,
    onBackToSavedConfigs,
    onDomainChange,
    onVersionChange,
    onConfigChange,
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

            <FieldGroup>
                {isLoggedIn ? (
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
                ) : (
                    <>
                        <TextField
                            label="Enter Subscriber Url"
                            required
                            placeholder="https://example.com"
                            error={errors.subscriberUrl?.message}
                            {...register("subscriberUrl", {
                                required: "Field required",
                                pattern: {
                                    value: /^https?:\/\/.*/i,
                                    message: "URL must start with http:// or https://",
                                },
                                onChange: (e) =>
                                    trackSchemaValidationForm(
                                        "Added subscriber url",
                                        e.target.value
                                    ),
                            })}
                        />
                        <DomainVersionUsecaseFields
                            control={control}
                            versionOptions={versionOptions}
                            usecaseOptions={usecaseOptions}
                            watchedDomain={watchedDomain}
                            watchedVersion={watchedVersion}
                            domainOptions={domains.map((d) => d.key)}
                            onDomainChange={onDomainChange}
                            onVersionChange={onVersionChange}
                        />
                        <ComboBox
                            control={control}
                            name="npType"
                            label="Select App Type"
                            options={["BAP", "BPP"]}
                            placeholder="App Type"
                            required
                            onValueChange={(value) =>
                                trackSchemaValidationForm("Added np type", value)
                            }
                        />
                        <ComboBox
                            control={control}
                            name="env"
                            label="Select Environment"
                            options={["PRE-PRODUCTION"]}
                            placeholder="Select environment"
                            required
                            onValueChange={(value) =>
                                trackSchemaValidationForm("Added environment", value)
                            }
                        />
                    </>
                )}
            </FieldGroup>

            <SessionFormActions isSubmitting={isSubmitting} />
        </form>
    );
};
