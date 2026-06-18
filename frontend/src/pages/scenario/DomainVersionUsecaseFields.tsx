import { SelectField } from "@/components/ui/SelectField";
import { trackSchemaValidationForm } from "@/pages/scenario/helpers";
import { IDomainVersionUsecaseFieldsProps } from "@/pages/scenario/types";

export const DomainVersionUsecaseFields = ({
    control,
    versionOptions,
    usecaseOptions,
    watchedDomain,
    watchedVersion,
    onDomainChange,
    onVersionChange,
    domainOptions,
}: IDomainVersionUsecaseFieldsProps) => (
    <>
        {domainOptions && (
            <SelectField
                control={control}
                name="domain"
                label="Select Domain"
                options={domainOptions}
                placeholder="Select domain"
                required
                onValueChange={onDomainChange}
            />
        )}
        <SelectField
            control={control}
            name="version"
            label="Select Version"
            options={versionOptions}
            placeholder="Select version"
            required
            disabled={!watchedDomain}
            onValueChange={onVersionChange}
        />
        <SelectField
            control={control}
            name="usecaseId"
            label="Select Usecase"
            options={usecaseOptions}
            placeholder="Select usecase"
            required
            disabled={!watchedVersion}
            onValueChange={(value) => trackSchemaValidationForm("Added usecase", value)}
        />
    </>
);
