import react from "react";
// import { useWatch } from "react-hook-form";
import GenericForm from "@components/ui/forms/generic-form";
import { FormInput } from "@components/ui/forms/form-input";
import FormSelect from "@components/ui/forms/form-select";

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

export interface InitialFormProps {
  formData: react.MutableRefObject<FlowTestingFormData>;
  onSubmitHandler: (data: any) => Promise<void>;
  dynamicList: {
    domain: any[];
    version: any[];
    usecase: any[];
  };
  dynamicValue: FlowTestingFormData;
  setDynamicList: react.Dispatch<
    react.SetStateAction<{
      domain: any[];
      version: any[];
      usecase: any[];
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
    const onSubmit = async (data: any) => {
      const [domain, type, uri] = data.config.split(" - ");
      data.npType = type;
      data.domain = domain;
      data.subscriberUrl = uri;
      data.env = "LOGGED-IN";
      await onSubmitHandler(data);
      console.log("data", domain, type, uri, data);
    };

    const configOptions = user.subscriberData.mappings.map(
      mapping => `${mapping.domain} - ${mapping.type} - ${mapping.uri}`,
    );

    return (
      <GenericForm defaultValues={formData.current} onSubmit={onSubmit}>
        <FormSelect
          name="config"
          label="Select Configured Domain"
          options={configOptions}
          currentValue={""}
          setSelectedValue={(data: string) => {
            const [domain, type, uri] = data.split(" - ");
            console.log("domain", domain, type, uri, data.split(" - "));
            formData.current = {
              ...formData.current,
              domain: domain,
              config: data,
            };
            setDyanmicValue(prev => ({
              ...prev,
              domain: domain,
              version: "",
              usecaseId: "",
            }));
            setDynamicList(prev => {
              let filteredVersion: any = [];
              prev.domain.forEach((item: any) => {
                if (item.key === domain) {
                  filteredVersion = item.version;
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
          options={dynamicList?.version?.map((val: any) => val.key) || []}
          currentValue={dynamicValue.version}
          setSelectedValue={(data: string) => {
            formData.current = { ...formData.current, version: data };
            setDyanmicValue(prev => ({
              ...prev,
              version: data,
              usecaseId: "",
            }));
            setDynamicList(prev => {
              let filteredUsecase: any = [];
              prev.version.forEach((item: any) => {
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
          options={dynamicList?.usecase || []}
          currentValue={dynamicValue.usecaseId}
          setSelectedValue={(data: string) => {
            formData.current = {
              ...formData.current,
              usecaseId: data,
            };
            setDyanmicValue(prev => ({
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

  return (
    <GenericForm defaultValues={formData.current} onSubmit={onSubmitHandler}>
      <FormInput
        label="Enter Subscriber Url"
        name="subscriberUrl"
        required={true}
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
        options={dynamicList.domain.map((val: any) => val.key)}
        currentValue={dynamicValue.domain}
        setSelectedValue={(data: string) => {
          trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Added domain",
            label: data,
          });
          formData.current = { ...formData.current, domain: data };
          setDyanmicValue(prev => ({
            ...prev,
            domain: data,
            version: "",
            usecaseId: "",
          }));
          setDynamicList(prev => {
            let filteredVersion: any = [];
            prev.domain.forEach((item: any) => {
              if (item.key === data) {
                filteredVersion = item.version;
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
        options={dynamicList?.version?.map((val: any) => val.key) || []}
        currentValue={dynamicValue.version}
        setSelectedValue={(data: string) => {
          trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Added version",
            label: data,
          });
          formData.current = { ...formData.current, version: data };
          setDyanmicValue(prev => ({
            ...prev,
            version: data,
            usecaseId: "",
          }));
          setDynamicList(prev => {
            let filteredUsecase: any = [];
            prev.version.forEach((item: any) => {
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
        options={dynamicList?.usecase || []}
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
          setDyanmicValue(prev => ({
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
          setDyanmicValue(prev => {
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
          setDyanmicValue(prev => ({
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
