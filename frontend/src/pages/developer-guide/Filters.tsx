import { FC } from "react";
import GenericForm from "@components/ui/forms/generic-form";
import FormSelect from "@components/ui/forms/form-select";

interface FiltersProps {
    onSubmit: (data: { domain: string; version: string; useCase: string }) => Promise<void>;
}

const Filters: FC<FiltersProps> = ({ onSubmit }) => {
    // Placeholder options; replace with API/constants when filters are wired
    const domainOptions = [{ key: "Select Domain", value: "" }, "Domain 1", "Domain 2", "Domain 3"];
    const versionOptions = [
        { key: "Select Version", value: "" },
        "Version 1",
        "Version 2",
        "Version 3",
    ];
    const useCaseOptions = [
        { key: "Select Use Case", value: "" },
        "Use Case 1",
        "Use Case 2",
        "Use Case 3",
    ];

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Filters
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Domain, version & use case</p>
                </div>
                <GenericForm onSubmit={onSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <FormSelect
                            name="domain"
                            label="Domain"
                            options={domainOptions}
                            required={true}
                        />
                        <FormSelect
                            name="version"
                            label="Version"
                            options={versionOptions}
                            required={true}
                        />
                        <FormSelect
                            name="useCase"
                            label="Use Case"
                            options={useCaseOptions}
                            required={true}
                        />
                    </div>
                </GenericForm>
            </div>
        </div>
    );
};

export default Filters;
