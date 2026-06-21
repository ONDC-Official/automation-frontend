import { FC } from "react";
import { useFormFieldData, type IDomainVersionWithUsecase } from "@/hooks/useFormFieldData";
import type { IDomain, IDomainVersion } from "@/pages/schema-validation/types";

interface DeveloperGuideHeaderFiltersProps {
    onSubmit: (data: { domain: string; version: string; useCase: string }) => Promise<void>;
}

const selectClass =
    "h-9 w-[120px] min-w-[120px] max-w-[120px] md:w-[140px] md:min-w-[140px] md:max-w-[140px] lg:w-[160px] lg:min-w-[160px] lg:max-w-[160px] rounded-lg border border-sky-100 dark:border-sky-500/30 bg-white dark:bg-surface-elevated px-3 text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 truncate";

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
                <select
                    id="dev-guide-domain-select"
                    className={selectClass}
                    value={dynamicValue.domain}
                    onChange={(e) => handleDomainChange(e.target.value)}
                >
                    <option value="" disabled>
                        Select
                    </option>
                    {dynamicList.domain.map((d: IDomain) => (
                        <option key={d.key} value={d.key}>
                            {d.key}
                        </option>
                    ))}
                </select>
            </div>

            <div className={pillClass}>
                <label
                    htmlFor="dev-guide-version-select"
                    className="text-xs font-bold text-gray-700"
                >
                    Version
                </label>
                <select
                    id="dev-guide-version-select"
                    className={selectClass}
                    value={dynamicValue.version}
                    disabled={!dynamicValue.domain}
                    onChange={(e) => handleVersionChange(e.target.value)}
                >
                    <option value="" disabled>
                        Select
                    </option>
                    {(dynamicList.version?.map((v: IDomainVersion) => v.key) || []).map((key) => (
                        <option key={key} value={key}>
                            {key}
                        </option>
                    ))}
                </select>
            </div>

            <div className={pillClass}>
                <label
                    htmlFor="dev-guide-usecase-select"
                    className="text-xs font-bold text-gray-700"
                >
                    Use Case
                </label>
                <select
                    id="dev-guide-usecase-select"
                    className={selectClass}
                    value={dynamicValue.usecaseId}
                    disabled={!dynamicValue.version}
                    onChange={(e) => handleUseCaseChange(e.target.value)}
                >
                    <option value="" disabled>
                        Select
                    </option>
                    {(dynamicList.usecase || []).map((uc) => (
                        <option key={uc} value={uc}>
                            {uc}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DeveloperGuideHeaderFilters;
