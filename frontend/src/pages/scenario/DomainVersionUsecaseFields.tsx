import { ComboBox } from "@/components/Shadcn/ComboBox";
import { trackSchemaValidationForm } from "@/pages/scenario/helpers";
import {
    IDomainVersionUsecaseFields,
    IDomainVersionUsecaseFieldsProps,
} from "@/pages/scenario/types";
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
}: IDomainVersionUsecaseFieldsProps<T>) => (
    <>
        {domainOptions && (
            <ComboBox
                control={control}
                name={"domain" as FieldPath<T>}
                label="Select Domain"
                options={domainOptions}
                placeholder="Select domain"
                required
                onValueChange={onDomainChange}
            />
        )}
        <ComboBox
            control={control}
            name={"version" as FieldPath<T>}
            label="Select Version"
            options={versionOptions}
            placeholder="Select version"
            required
            disabled={!watchedDomain}
            onValueChange={onVersionChange}
        />
        <ComboBox
            control={control}
            name={"usecaseId" as FieldPath<T>}
            label="Select Usecase"
            options={usecaseOptions}
            placeholder="Select usecase"
            required
            disabled={!watchedVersion}
            onValueChange={(value) => trackSchemaValidationForm("Added usecase", value)}
        />
    </>
);
