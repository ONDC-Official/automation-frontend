import { FormInput } from "@/components/ui/forms/form-input";
import LoadingButton from "@/components/ui/forms/loading-button";
import type { CreateSessionPanelProps } from "@pages/seller-load-testing/types";

export const CreateSessionPanel = ({
    handleSubmit,
    onSubmit,
    register,
    errors,
    isLoading,
}: CreateSessionPanelProps) => (
    <div className="rounded-2xl border border-sky-100 bg-white overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-500">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-semibold text-white text-base leading-tight">
                            Create a new Session
                        </h1>
                        <p className="text-sky-200 text-xs mt-0.5">
                            Fill the details to begin flow testing.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-5 py-4 space-y-4">
                <FormInput
                    label="BPP ID"
                    name="bppId"
                    required={true}
                    labelInfo="Enter your BPP ID"
                    register={register}
                    errors={errors}
                    onValueChange={() => {}}
                />
                <FormInput
                    label="BPP URI"
                    name="bppUri"
                    required={true}
                    labelInfo="Enter your BPP URI"
                    register={register}
                    errors={errors}
                    validations={{
                        pattern: {
                            value: /^https?:\/\/.*/i,
                            message: "URL must start with http:// or https://",
                        },
                    }}
                    onValueChange={() => {}}
                />

                <div className="[&_input]:text-gray-400 [&_input]:cursor-not-allowed">
                    <FormInput
                        label="Domain"
                        name="domain"
                        required={false}
                        labelInfo=""
                        register={register}
                        errors={errors}
                        disable={true}
                    />
                </div>
                <div className="[&_input]:text-gray-400 [&_input]:cursor-not-allowed">
                    <FormInput
                        label="Version"
                        name="version"
                        required={false}
                        labelInfo=""
                        register={register}
                        errors={errors}
                        disable={true}
                    />
                </div>
                <div className="[&_input]:text-gray-400 [&_input]:cursor-not-allowed">
                    <FormInput
                        label="Usecase"
                        name="usecase"
                        required={false}
                        labelInfo=""
                        register={register}
                        errors={errors}
                        disable={true}
                    />
                </div>
                <div className="[&_input]:text-gray-400 [&_input]:cursor-not-allowed">
                    <FormInput
                        label="Environment"
                        name="environment"
                        required={false}
                        labelInfo=""
                        register={register}
                        errors={errors}
                        disable={true}
                    />
                </div>
                <div className="flex justify-end">
                    <LoadingButton
                        type="submit"
                        buttonText="Create Session"
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </form>
    </div>
);
