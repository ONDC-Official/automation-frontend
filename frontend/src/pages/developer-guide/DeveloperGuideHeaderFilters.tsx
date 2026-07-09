import { FC } from "react";
import { useFormFieldData, type IDomainVersionWithUsecase } from "@hooks/useFormFieldData";
import type { IDomain, IDomainVersion } from "@pages/schema-validation/types";
import { ComboBoxControl } from "@components/Shadcn/ComboBox";

interface DeveloperGuideHeaderFiltersProps {
    onSubmit: (data: { domain: string; version: string; useCase: string }) => Promise<void>;
}

const selectWidthClass = "w-[120px] md:w-[140px] lg:w-[160px]";

const pillClass = "flex items-center gap-2";

const DeveloperGuideHeaderFilters: FC<DeveloperGuideHeaderFiltersProps> = ({ onSubmit }) => {
    const { dynamicList, dynamicValue, formData, setDynamicList, setDyanmicValue } =
        useFormFieldData();

    const handleDomainChange = (value: string) => {
        formData.current = { ...formData.current, domain: value };
        setDyanmicValue((prev) => ({
            ...prev,
            domain: value,
            version: "",
            usecaseId: "",
        }));
        setDynamicList((prev) => {
            const domainEntry = prev.domain.find((item: IDomain) => item.key === value);
            const filteredVersion = (domainEntry?.version as IDomainVersionWithUsecase[]) ?? [];
            return { ...prev, version: filteredVersion, usecase: [] };
        });
    };

    const handleVersionChange = (value: string) => {
        formData.current = { ...formData.current, version: value };
        setDyanmicValue((prev) => ({
            ...prev,
            version: value,
            usecaseId: "",
        }));
        setDynamicList((prev) => {
            const versionEntry = prev.version.find(
                (item: IDomainVersionWithUsecase) => item.key === value
            );
            return { ...prev, usecase: versionEntry?.usecase ?? [] };
        });
    };

    const handleUseCaseChange = async (value: string) => {
        formData.current = { ...formData.current, usecaseId: value };
        setDyanmicValue((prev) => ({ ...prev, usecaseId: value }));
        await onSubmit({
            domain: formData.current.domain,
            version: formData.current.version,
            useCase: value,
        });
    };

    return (
        <div className="hidden md:flex flex-wrap items-center gap-6 text-sm">
            <div className={pillClass}>
                <label
                    htmlFor="dev-guide-domain-select"
                    className="text-xs font-bold text-gray-700"
                >
                    Domain
                </label>
                <ComboBoxControl
                    id="dev-guide-domain-select"
                    className={selectWidthClass}
                    value={dynamicValue.domain}
                    onValueChange={handleDomainChange}
                    placeholder="Select"
                    options={dynamicList.domain.map((d: IDomain) => ({
                        value: d.key,
                        label: d.key,
                    }))}
                />
            </div>

            <div className={pillClass}>
                <label
                    htmlFor="dev-guide-version-select"
                    className="text-xs font-bold text-gray-700"
                >
                    Version
                </label>
                <ComboBoxControl
                    id="dev-guide-version-select"
                    className={selectWidthClass}
                    value={dynamicValue.version}
                    disabled={!dynamicValue.domain}
                    onValueChange={handleVersionChange}
                    placeholder="Select"
                    options={(dynamicList.version?.map((v: IDomainVersion) => v.key) || []).map(
                        (key) => ({ value: key, label: key })
                    )}
                />
            </div>

            <div className={pillClass}>
                <label
                    htmlFor="dev-guide-usecase-select"
                    className="text-xs font-bold text-gray-700"
                >
                    Use Case
                </label>
                <ComboBoxControl
                    id="dev-guide-usecase-select"
                    className={selectWidthClass}
                    value={dynamicValue.usecaseId}
                    disabled={!dynamicValue.version}
                    onValueChange={handleUseCaseChange}
                    placeholder="Select"
                    options={(dynamicList.usecase || []).map((uc) => ({ value: uc, label: uc }))}
                />
            </div>
        </div>
    );
};

export default DeveloperGuideHeaderFilters;
