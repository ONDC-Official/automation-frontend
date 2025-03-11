import FormSelect from "./../forms/form-select";
import { FormInput } from "../forms/form-input";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
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
}

const FlowDetails = ({
  onNpChange,
  getSubUrl,
  onSetListning,
  onGetActions,
}: IProps) => {
  const {
    register,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
  });
  const [config, setConfig] = useState<any>({});
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("");
  const [usecases, setUsecases] = useState([]);
  const [usecase, setUsecase] = useState("");
  const [apis, setApis] = useState([]);
  const [api, setApi] = useState("");
  const [versions, setVersions] = useState([]);
  const [version, setVersion] = useState("");
  const [npType, setNpType] = useState("BAP");
  const [subUrl, setSubUrl] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isSessionCreated, setIsSessionCreated] = useState(false);

  const getPredefinedConfig = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/flow/customFlow`
      );

      const filteredDomains = response.data?.domain?.map(
        (item: any) => item.name
      );

      setDomains(filteredDomains);
      setConfig(response.data);
    } catch (e) {
      console.log("Something went wrong: ", e);
      toast.error("Something went wrong while fetching config");
    }
  };

  const getVersions = (selectedDomain: string) => {
    setDomain(selectedDomain);
    const filteredVersions: any = [];

    config?.domain?.map((item: any) => {
      if (item.name === selectedDomain) {
        item?.version?.map((val: any) => {
          filteredVersions.push(val.id);
        });
      }
    });

    setVersions(filteredVersions);
  };

  const getUsecase = (selectedVersion: any) => {
    setVersion(selectedVersion);
    const filteredUsecase: any = [];

    config?.domain?.map((item: any) => {
      if (item.name === domain) {
        item?.version?.map((val: any) => {
          if (val.id === selectedVersion) {
            val?.usecase?.map((usecases: any) => {
              filteredUsecase.push(usecases.summary);
            });
          }
        });
      }
    });

    setUsecases(filteredUsecase);
  };

  const getApi = (selectedUsecase?: any) => {
    if (selectedUsecase) {
      setUsecase(selectedUsecase);
    }
    const filteredApi: any = [];

    config?.domain?.map((item: any) => {
      if (item.name === domain) {
        item?.version?.map((ver: any) => {
          if (ver.id === version) {
            console.log("version", ver);
            ver?.usecase?.map((val: any) => {
              if (val.summary === (selectedUsecase || usecase)) {
                val.api?.map((apis: any) => {
                  if (npType === "BAP" && !apis?.name?.startsWith("on_")) {
                    filteredApi.push(apis.name);
                  }
                  if (npType === "BPP" && apis?.name?.startsWith("on_")) {
                    filteredApi.push(apis.name);
                  }
                });
              }
            });
          }
        });
      }
    });

    setApis(filteredApi);
  };

  const createUnitSession = async () => {
    const payload: any = {
      domain: domain,
      participantType: npType,
      subscriberUrl: subUrl,
      version: version,
      usecaseId: usecase.toUpperCase(),
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/unit/unit-session`,
        payload
      );

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

  useEffect(() => {
    getPredefinedConfig();
  }, []);

  useEffect(() => {
    if (!npType || !subUrl || !domain || !version || !usecase) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [npType, subUrl, domain, version, usecase]);

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
            setNpType(data);
            onNpChange(data);
            getApi();
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
            getSubUrl(data);
            setSubUrl(data);
          }}
        />
        <FormSelect
          name="domain"
          label="Domain"
          options={domains}
          required
          register={register}
          errors={errors}
          disabled={domains.length === 0}
          setSelectedValue={(data: any) => {
            getVersions(data);
            // getUsecase(data);
          }}
          nonSelectedValue
        />
        {/* </div>
			<div className="flex flex-row gap-4"> */}
        <FormSelect
          name="version"
          label="Version"
          options={versions}
          required
          register={register}
          errors={errors}
          disabled={versions.length === 0}
          setSelectedValue={(data: any) => {
            getUsecase(data);
          }}
          nonSelectedValue
        />
        <FormSelect
          name="usecase"
          label="Usecase"
          options={usecases}
          required
          register={register}
          errors={errors}
          disabled={usecases.length === 0}
          setSelectedValue={(data: any) => {
            getApi(data);
          }}
          nonSelectedValue
        />
        {npType === "BAP" && (
          <FormSelect
            name="api"
            label="Expected API"
            options={apis}
            required
            register={register}
            errors={errors}
            disabled={apis.length === 0}
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
          onClick={() => window.location.reload()}
        >
          Create New Session
        </button>
        <button
          className={`${buttonClass} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={createUnitSession}
          disabled={isDisabled || isSessionCreated}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default FlowDetails;
