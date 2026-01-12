import react from "react";
import GenericForm from "@components/GenericForm";
import { FormInput } from "@components/Input";
import FormSelect from "@/components/Select/form-select";
import { UseFormRegister, FieldValues } from "react-hook-form";

import { UserContext } from "@context/userContext";
import { trackEvent } from "@utils/analytics";

type FlowTestingFormData = {
  config?: string;
  domain: string;
  version: string;
  usecaseId: string;
  subscriberUrl: string;
  npType: string;
  env: string;
};

interface DynamicListItem {
  key: string;
  version?: Array<{ key: string; usecase?: Array<{ key: string }> }>;
}

export interface InitialFormProps {
  formData: react.MutableRefObject<FlowTestingFormData>;
  onSubmitHandler: (data: FlowTestingFormData) => Promise<void>;
  dynamicList: {
    domain: DynamicListItem[];
    version: Array<{ key: string; usecase?: Array<{ key: string }> }>;
    usecase: Array<{ key: string }>;
  };
  dynamicValue: FlowTestingFormData;
  setDynamicList: react.Dispatch<
    react.SetStateAction<{
      domain: DynamicListItem[];
      version: Array<{ key: string; usecase?: Array<{ key: string }> }>;
      usecase: Array<{ key: string }>;
    }>
  >;
  setDyanmicValue: react.Dispatch<react.SetStateAction<FlowTestingFormData>>;
}

export default function InitialFlowForm({
  formData,
  onSubmitHandler,
  dynamicList,
  dynamicValue,
  setDynamicList,
  setDyanmicValue,
}: InitialFormProps) {
  const user = react.useContext(UserContext);

  if (user.userDetails?.participantId && user.subscriberData) {
    const onSubmit = async (data: Record<string, unknown>) => {
      const configValue = typeof data.config === "string" ? data.config : "";
      const [domain, type, uri] = configValue.split(" - ");
      const submittedData: FlowTestingFormData = {
        ...formData.current,
        npType: type,
        domain: domain,
        subscriberUrl: uri,
        env: "LOGGED-IN",
        config: configValue,
        version: typeof data.version === "string" ? data.version : "",
        usecaseId: typeof data.usecaseId === "string" ? data.usecaseId : "",
      };
      await onSubmitHandler(submittedData);
    };

    const configOptions = user.subscriberData.mappings.map(
      (mapping) => `${mapping.domain} - ${mapping.type} - ${mapping.uri}`
    );

    return (
      <GenericForm defaultValues={formData.current} onSubmit={onSubmit}>
        <FormSelect
          name="config"
          label="Select Configured Domain"
          options={configOptions}
          currentValue={""}
          setSelectedValue={(data: string) => {
            const [domain, _type, _uri] = data.split(" - ");
            formData.current = {
              ...formData.current,
              domain: domain,
              config: data,
            };
            setDyanmicValue((prev) => ({
              ...prev,
              domain: domain,
              version: "",
              usecaseId: "",
            }));
            setDynamicList((prev) => {
              let filteredVersion: Array<{ key: string; usecase?: Array<{ key: string }> }> = [];
              prev.domain.forEach((item: DynamicListItem) => {
                if (item.key === domain) {
                  filteredVersion = item.version || [];
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
          required
        />
        {/* {dynamicList.version?.length ? ( */}
        <FormSelect
          label="Select Version"
          name="version"
          required={true}
          options={
            dynamicList?.version?.map(
              (val: { key: string; usecase?: Array<{ key: string }> }) => val.key
            ) || []
          }
          currentValue={dynamicValue.version}
          setSelectedValue={(data: string) => {
            formData.current = { ...formData.current, version: data };
            setDyanmicValue((prev) => ({
              ...prev,
              version: data,
              usecaseId: "",
            }));
            setDynamicList((prev) => {
              let filteredUsecase: Array<{ key: string }> = [];
              prev.version.forEach((item: { key: string; usecase?: Array<{ key: string }> }) => {
                if (item.key === data) {
                  filteredUsecase = item.usecase || [];
                }
              });
              return {
                ...prev,
                usecase: filteredUsecase,
              };
            });
          }}
          nonSelectedValue
        />
        {/* ) : (
					<></>
				)} */}
        {/* {dynamicList.usecase?.length ? ( */}
        <FormSelect
          label="Enter Usecase"
          name="usecaseId"
          required={true}
          options={dynamicList?.usecase?.map((item) => item.key) || []}
          currentValue={dynamicValue.usecaseId}
          setSelectedValue={(data: string) => {
            formData.current = {
              ...formData.current,
              usecaseId: data,
            };
            setDyanmicValue((prev) => ({
              ...prev,
              usecaseId: data,
            }));
          }}
          nonSelectedValue
        />
        {/* ) : (
					<></>
				)} */}
        {/* <FormSelect
					name="npType"
					label="Select Type"
					options={["BAP", "BPP"]}
					setSelectedValue={(data: "BAP" | "BPP") => {
						setDyanmicValue((prev) => {
							return {
								...prev,
								npType: data,
							};
						});
						formData.current = { ...formData.current, npType: data };
					}}
					required
				/> */}
      </GenericForm>
    );
  }

  const onSubmit = async (data: Record<string, unknown>) => {
    const submittedData: FlowTestingFormData = {
      domain: typeof data.domain === "string" ? data.domain : "",
      version: typeof data.version === "string" ? data.version : "",
      usecaseId: typeof data.usecaseId === "string" ? data.usecaseId : "",
      subscriberUrl: typeof data.subscriberUrl === "string" ? data.subscriberUrl : "",
      npType: typeof data.npType === "string" ? data.npType : "",
      env: typeof data.env === "string" ? data.env : "",
    };
    await onSubmitHandler(submittedData);
  };

  // Placeholder register function that will be overridden by GenericForm
  // GenericForm injects the real register function via React.cloneElement
  const placeholderRegister = (() => ({})) as unknown as UseFormRegister<FieldValues>;

  return (
    <GenericForm defaultValues={formData.current} onSubmit={onSubmit}>
      <FormInput
        register={placeholderRegister}
        label="Enter Subscriber Url"
        name="subscriberUrl"
        required={true}
        errors={{}}
        labelInfo="your registered subscriber url"
        validations={{
          pattern: {
            value: /^https?:\/\/.*/i,
            message: "URL must start with http:// or https://",
          },
        }}
        onValueChange={(data: string) => {
          trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Added subscriber url",
            label: data,
          });
          formData.current = {
            ...formData.current,
            subscriberUrl: data,
          };
        }}
      />
      <FormSelect
        name="domain"
        label="Select Domain"
        options={dynamicList.domain.map((val: DynamicListItem) => val.key)}
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
            let filteredVersion: Array<{ key: string; usecase?: Array<{ key: string }> }> = [];
            prev.domain.forEach((item: DynamicListItem) => {
              if (item.key === data) {
                filteredVersion = item.version || [];
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
        required
      />
      {/* {dynamicList.version?.length ? ( */}
      <FormSelect
        label="Select Version"
        name="version"
        required={true}
        options={
          dynamicList?.version?.map(
            (val: { key: string; usecase?: Array<{ key: string }> }) => val.key
          ) || []
        }
        currentValue={dynamicValue.version}
        setSelectedValue={(data: string) => {
          trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Added version",
            label: data,
          });
          formData.current = { ...formData.current, version: data };
          setDyanmicValue((prev) => ({
            ...prev,
            version: data,
            usecaseId: "",
          }));
          setDynamicList((prev) => {
            let filteredUsecase: Array<{ key: string }> = [];
            prev.version.forEach((item: { key: string; usecase?: Array<{ key: string }> }) => {
              if (item.key === data) {
                filteredUsecase = item.usecase || [];
              }
            });
            return {
              ...prev,
              usecase: filteredUsecase,
            };
          });
        }}
        nonSelectedValue
      />
      {/* ) : (
				<></>
			)} */}
      {/* {dynamicList.usecase?.length ? ( */}
      <FormSelect
        label="Select Usecase"
        name="usecaseId"
        required={true}
        options={dynamicList?.usecase?.map((item) => item.key) || []}
        currentValue={dynamicValue.usecaseId}
        setSelectedValue={(data: string) => {
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
        }}
        nonSelectedValue
      />
      {/* ) : (
				<></>
			)} */}
      <FormSelect
        name="npType"
        label="Select App Type"
        options={["BAP", "BPP"]}
        currentValue={dynamicValue.npType}
        setSelectedValue={(data: string) => {
          trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Added np type",
            label: data,
          });
          setDyanmicValue((prev) => {
            return {
              ...prev,
              npType: data,
            };
          });
          formData.current = { ...formData.current, npType: data };
        }}
        required
      />
      <FormSelect
        name="env"
        label="Select Environment"
        options={["STAGING", "PRE-PRODUCTION"]}
        currentValue={dynamicValue.env}
        setSelectedValue={(data: string) => {
          trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Added environment",
            label: data,
          });
          setDyanmicValue((prev) => ({
            ...prev,
            env: data,
          }));
          formData.current = { ...formData.current, env: data };
        }}
        required
      />
    </GenericForm>
  );
}
