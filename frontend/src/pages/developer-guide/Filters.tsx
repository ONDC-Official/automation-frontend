import { FC } from "react";
import FormSelect from "@components/ui/forms/form-select";
import { Domain, DomainVersion } from "@/pages/schema-validation/types";
import { trackEvent } from "@utils/analytics";
import { useFormFieldData } from "@/hooks/useFormFieldData";
import { DomainVersionWithUsecase } from "@/pages/scenario";

interface FiltersProps {
    onSubmit: (data: { domain: string; version: string; useCase: string }) => Promise<void>;
}

const Filters: FC<FiltersProps> = ({ onSubmit }) => {
    const { dynamicList, dynamicValue, formData, setDynamicList, setDyanmicValue } =
        useFormFieldData();

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="space-y-4">
                <div className="flex flex-col gap-4">
                    <FormSelect
                        name="domain"
                        label="Domain"
                        options={dynamicList.domain.map((val: Domain) => val.key)}
                        currentValue={dynamicValue.domain}
                        setSelectedValue={(data: string) => {
                            trackEvent({
                                category: "SCHEMA_VALIDATION-FORM",
                                action: "Added domain",
                                label: data,
                            });
                            formData.current = { ...formData.current, domain: data };
                            setDyanmicValue((prev) => ({
                                ...prev,
                                domain: data,
                                version: "",
                                usecaseId: "",
                            }));
                            setDynamicList((prev) => {
                                let filteredVersion: DomainVersionWithUsecase[] = [];
                                prev.domain.forEach((item: Domain) => {
                                    if (item.key === data) {
                                        filteredVersion =
                                            item.version as DomainVersionWithUsecase[];
                                    }
                                });
                                return {
                                    ...prev,
                                    version: filteredVersion,
                                    usecase: [],
                                };
                            });
                        }}
                        nonSelectedValue
                        required={true}
                    />
                    <FormSelect
                        name="version"
                        label="Version"
                        options={dynamicList?.version?.map((val: DomainVersion) => val.key) || []}
                        currentValue={dynamicValue.version}
                        setSelectedValue={(data: string) => {
                            formData.current = { ...formData.current, version: data };
                            setDyanmicValue((prev) => ({
                                ...prev,
                                version: data,
                                usecaseId: "",
                            }));
                            setDynamicList((prev) => {
                                let filteredUsecase: string[] = [];
                                prev.version.forEach((item: DomainVersionWithUsecase) => {
                                    if (item.key === data) {
                                        filteredUsecase = item.usecase;
                                    }
                                });
                                return {
                                    ...prev,
                                    usecase: filteredUsecase,
                                };
                            });
                        }}
                        required={true}
                        nonSelectedValue
                    />
                    <FormSelect
                        name="useCase"
                        label="Use Case"
                        options={dynamicList?.usecase || []}
                        currentValue={dynamicValue.usecaseId}
                        setSelectedValue={async (data: string) => {
                            trackEvent({
                                category: "SCHEMA_VALIDATION-FORM",
                                action: "Added usecase",
                                label: data,
                            });
                            formData.current = {
                                ...formData.current,
                                usecaseId: data,
                            };
                            setDyanmicValue((prev) => ({
                                ...prev,
                                usecaseId: data,
                            }));
                            await onSubmit({
                                domain: formData.current.domain,
                                version: formData.current.version,
                                useCase: data,
                            });
                        }}
                        nonSelectedValue
                        required={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default Filters;
