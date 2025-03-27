import FormSelect from "./../forms/form-select";
import { FormInput } from "../forms/form-input";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { buttonClass } from "./../../ui/forms/loading-button";
import {
  requestForFlowPermission,
  addExpectation,
} from "../../../utils/request-utils";

interface IProps {
  onNpChange: (data: string) => void;
  getSubUrl: (data: string) => void;
  onSetListning: (data: string, sessionData: any) => void;
  onGetActions: (sessionData: any) => void;
  onFormSubmit: (data: any) => void;
}

const EXPECTED_APIS = [
  "search",
  "select",
  "init",
  "confirm",
  "status",
  "update",
  "track",
];

const FlowDetails = ({
  onNpChange,
  getSubUrl,
  onSetListning,
  onGetActions,
  onFormSubmit,
}: IProps) => {
  const {
    register,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
  });
  const [api, setApi] = useState("");
  const [npType, setNpType] = useState("BAP");
  const [subUrl, setSubUrl] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isSessionCreated, setIsSessionCreated] = useState(false);
  const [dynamicList, setDynamicList] = useState({
    domain: [],
    version: [],
    usecase: [],
    allData: false,
  });
  const formData = useRef({
    domain: "",
    version: "",
    usecaseId: "",
    subscriberUrl: "",
    npType: "BAP",
  });

  const createUnitSession = async () => {
    const payload: any = {
      domain: formData.current.domain,
      participantType: formData.current.npType,
      subscriberUrl: formData.current.subscriberUrl,
      version: formData.current.version,
      usecaseId: formData.current.usecaseId.toUpperCase(),
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/unit/unit-session`,
        payload
      );

      onFormSubmit(payload);
      console.log("Response", response.data);
      toast.info("Session created.");
      const localData =
        JSON.parse(localStorage.getItem("sessionIdForSupport") as string) || {};
      localStorage.setItem(
        "sessionIdForSupport",
        JSON.stringify({
          unitSession: response.data.sessionId,
          ...localData,
        })
      );
      if (npType === "BAP") {
        const permission = await requestForFlowPermission(api, subUrl);

        if (!permission) {
          return;
        }

        await addExpectation(api, "unit", subUrl, response.data.sessionId);

        setIsSessionCreated(true);
        onSetListning(subUrl, response.data);
      } else {
        setIsSessionCreated(true);
        onGetActions({ ...response.data, ...payload });
      }
    } catch (e) {
      console.log("Error while creating unit session", e);
      toast.error("Something went wrong");
    }
  };

  const fetchFormFieldData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
      );
      setDynamicList((prev) => {
        return { ...prev, domain: response.data.domain || [] };
      });
      console.log("form field data", response.data);
    } catch (e) {
      console.log("error while fetching form field data", e);
    }
  };

  useEffect(() => {
    fetchFormFieldData();
  }, []);

  useEffect(() => {
    console.log("formdAta", formData.current);
    if (
      !formData.current.domain ||
      !formData.current.npType ||
      !formData.current.subscriberUrl ||
      !formData.current.version ||
      !formData.current.usecaseId
    ) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [formData.current]);

  const getButtonText = () => {
    if (npType === "BAP") {
      return !isSessionCreated ? "Start Listening" : "listening...";
    }

    return !isSessionCreated ? "Create Session" : "Session Created";
  };

  return (
    <div
      className={`bg-white p-4 rounded shadow-lg mb-4 flex flex-col gap-1 grow`}
    >
      <div className="flex flex-row gap-4">
        <FormSelect
          name="npType"
          label="NP Type"
          options={["BAP", "BPP"]}
          defaultValue="BAP"
          required
          register={register}
          errors={errors}
          setSelectedValue={(data: any) => {
            formData.current = { ...formData.current, npType: data };
            setNpType(data);
            onNpChange(data);
          }}
        />
        <FormInput
          label="Subscriber Url"
          name="subscriberUrl"
          required={true}
          register={register}
          errors={errors}
          validateOnBlue={true}
          validations={{
            pattern: {
              value: /^https:\/\/.*/,
              message: "URL must start with https://",
            },
          }}
          onValueChange={(data: string) => {
            formData.current = { ...formData.current, subscriberUrl: data };
            getSubUrl(data);
            setSubUrl(data);
          }}
        />
        <FormSelect
          name="domain"
          label="Domain"
          options={dynamicList.domain}
          required
          register={register}
          errors={errors}
          disabled={dynamicList.domain.length === 0}
          setSelectedValue={(data: any) => {
            formData.current = { ...formData.current, domain: data };
            setDynamicList((prev) => {
              let filteredVersion: any = [];
              prev.domain.forEach((item: any) => {
                if (item.key === data) {
                  filteredVersion = item.version;
                }
              });
              return {
                ...prev,
                version: filteredVersion,
              };
            });
          }}
          nonSelectedValue
        />
        <FormSelect
          name="version"
          label="Version"
          options={dynamicList.version}
          required
          register={register}
          errors={errors}
          disabled={dynamicList.version.length === 0}
          setSelectedValue={(data: any) => {
            formData.current = { ...formData.current, version: data };
            setDynamicList((prev) => {
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
        <FormSelect
          name="usecase"
          label="Usecase"
          options={dynamicList.usecase}
          required
          register={register}
          errors={errors}
          disabled={dynamicList.usecase.length === 0}
          setSelectedValue={(data: any) => {
            formData.current = { ...formData.current, usecaseId: data };
            setDynamicList((prev) => {
              return {
                ...prev,
                allData: !prev.allData,
              };
            });
          }}
          nonSelectedValue
        />
        {npType === "BAP" && (
          <FormSelect
            name="api"
            label="Expected API"
            options={EXPECTED_APIS}
            required
            register={register}
            errors={errors}
            disabled={EXPECTED_APIS.length === 0}
            setSelectedValue={(data: any) => {
              setApi(data);
            }}
            nonSelectedValue
          />
        )}
      </div>
      <div className="flex flex-row gap-4">
        <button
          className={`${buttonClass} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={createUnitSession}
          disabled={isDisabled || isSessionCreated}
        >
          {getButtonText()}
        </button>
        <button
          className={`flex items-center justify-center px-4 py-2 text-sky-600 border border-sky-600 font-semibold w-full bg-white dark:bg-blue-400 dark:hover:bg-blue-500 focus:ring-blue-300 dark:focus:ring-blue-200 transition-all duration-300 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={() => window.location.reload()}
        >
          Reset Session
        </button>
      </div>
    </div>
  );
};

export default FlowDetails;
