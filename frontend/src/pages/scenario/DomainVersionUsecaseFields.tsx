import { ComboBox } from "@components/Shadcn/ComboBox";
import { trackSchemaValidationForm } from "@pages/scenario/helpers";
import {
    IDomainVersionUsecaseFields,
    IDomainVersionUsecaseFieldsProps,
} from "@pages/scenario/types";
import { FieldPath } from "react-hook-form";

export const DomainVersionUsecaseFields = <
    T extends IDomainVersionUsecaseFields = IDomainVersionUsecaseFields,
>({
    control,
    versionOptions,
    usecaseOptions,
    watchedDomain,
    watchedVersion,
    onDomainChange,
    onVersionChange,
    domainOptions,
    tooltips,
    floatingLabel = false,
}: IDomainVersionUsecaseFieldsProps<T>) => (
    <>
        {domainOptions && (
            <ComboBox
                control={control}
                name={"domain" as FieldPath<T>}
                label={floatingLabel ? "Domain" : "Select Domain"}
                floatingLabel={floatingLabel}
                options={domainOptions}
                placeholder="Select domain"
                required
                tooltip={tooltips?.domain}
                onValueChange={onDomainChange}
            />
        )}
        <ComboBox
            control={control}
            name={"version" as FieldPath<T>}
            label={floatingLabel ? "Version" : "Select Version"}
            floatingLabel={floatingLabel}
            options={versionOptions}
            placeholder="Select version"
            required
            tooltip={tooltips?.version}
            disabled={!watchedDomain}
            onValueChange={onVersionChange}
        />
        <ComboBox
            control={control}
            name={"usecaseId" as FieldPath<T>}
            label={floatingLabel ? "Use case" : "Select Usecase"}
            floatingLabel={floatingLabel}
            options={usecaseOptions}
            placeholder="Select usecase"
            required
            tooltip={tooltips?.usecase}
            disabled={!watchedVersion}
            onValueChange={(value) => trackSchemaValidationForm("Added usecase", value)}
        />
    </>
);
