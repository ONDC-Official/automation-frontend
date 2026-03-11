import { FC } from "react";
import { useFormFieldData, type DomainVersionWithUsecase } from "@/hooks/useFormFieldData";
import type { Domain, DomainVersion } from "@/pages/schema-validation/types";

interface DeveloperGuideHeaderFiltersProps {
    onSubmit: (data: { domain: string; version: string; useCase: string }) => Promise<void>;
}

const selectClass =
    "h-9 w-[120px] min-w-[120px] max-w-[120px] md:w-[140px] md:min-w-[140px] md:max-w-[140px] lg:w-[160px] lg:min-w-[160px] lg:max-w-[160px] rounded-lg border border-sky-100 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 truncate";

const pillClass = "flex items-center gap-2";

const DeveloperGuideHeaderFilters: FC<DeveloperGuideHeaderFiltersProps> = ({ onSubmit }) => {
    const { dynamicList, dynamicValue, formData, setDynamicList, setDyanmicValue } =
        useFormFieldData();

    return (
        <div className="hidden md:flex flex-wrap items-center gap-6 text-sm">
            <div className={pillClass}>
                <span className="text-xs font-bold text-gray-700">Domain</span>
                <select
                    className={selectClass}
                    value={dynamicValue.domain}
                    onChange={(e) => {
                        const value = e.target.value;
                        formData.current = { ...formData.current, domain: value };
                        setDyanmicValue((prev) => ({
                            ...prev,
                            domain: value,
                            version: "",
                            usecaseId: "",
                        }));
                        setDynamicList((prev) => {
                            let filteredVersion: DomainVersionWithUsecase[] = [];
                            prev.domain.forEach((item: Domain) => {
                                if (item.key === value) {
                                    filteredVersion = item.version as DomainVersionWithUsecase[];
                                }
                            });
                            return { ...prev, version: filteredVersion, usecase: [] };
                        });
                    }}
                >
                    <option value="" disabled>
                        Select
                    </option>
                    {dynamicList.domain.map((d: Domain) => (
                        <option key={d.key} value={d.key}>
                            {d.key}
                        </option>
                    ))}
                </select>
            </div>

            <div className={pillClass}>
                <span className="text-xs font-bold text-gray-700">Version</span>
                <select
                    className={selectClass}
                    value={dynamicValue.version}
                    disabled={!dynamicValue.domain}
                    onChange={(e) => {
                        const value = e.target.value;
                        formData.current = { ...formData.current, version: value };
                        setDyanmicValue((prev) => ({
                            ...prev,
                            version: value,
                            usecaseId: "",
                        }));
                        setDynamicList((prev) => {
                            let filteredUsecase: string[] = [];
                            prev.version.forEach((item: DomainVersionWithUsecase) => {
                                if (item.key === value) {
                                    filteredUsecase = item.usecase;
                                }
                            });
                            return { ...prev, usecase: filteredUsecase };
                        });
                    }}
                >
                    <option value="" disabled>
                        Select
                    </option>
                    {(dynamicList.version?.map((v: DomainVersion) => v.key) || []).map((key) => (
                        <option key={key} value={key}>
                            {key}
                        </option>
                    ))}
                </select>
            </div>

            <div className={pillClass}>
                <span className="text-xs font-bold text-gray-700">Use Case</span>
                <select
                    className={selectClass}
                    value={dynamicValue.usecaseId}
                    disabled={!dynamicValue.version}
                    onChange={async (e) => {
                        const value = e.target.value;
                        formData.current = { ...formData.current, usecaseId: value };
                        setDyanmicValue((prev) => ({ ...prev, usecaseId: value }));
                        await onSubmit({
                            domain: formData.current.domain,
                            version: formData.current.version,
                            useCase: value,
                        });
                    }}
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
