import FormSelect from "./../forms/form-select";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const FlowDetails = ({ onLoadPayload }) => {
  const {
    register,
    formState: { errors },
  } = useForm();
  const [config, setConfig] = useState({});
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("");
  const [usecases, setUsecases] = useState([]);
  const [usecase, setUsecase] = useState("");
  const [apis, setApis] = useState([]);
  const [apiType, setApiType] = useState([]);

  const getPredefinedConfig = async () => {
    // api call
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
      console.log("Somthin went wrong: ", e);
      toast.error("Something went wrong while fetching config");
    }
  };

  const getUsecase = (selectedDomain) => {
    // api call
    setDomain(selectedDomain);
    let filteredUsecase = [];

    config?.domain?.map((item: any) => {
      if (item.name === selectedDomain) {
        item?.usecase?.map((val) => {
          filteredUsecase.push(val.summary);
        });
      }
    });

    setUsecases(filteredUsecase);
  };

  const getApi = (selectedUsecase) => {
    setUsecase(selectedUsecase);
    const filteredApi = [];

    config?.domain?.map((item: any) => {
      if (item.name === domain) {
        item?.usecase?.map((val) => {
          if (val.summary === selectedUsecase) {
            val.api?.map((apis) => {
              filteredApi.push(apis.name);
            });
          }
        });
      }
    });

    setApis(filteredApi);
  };

  const getType = (seletedApi) => {
    const filteredApiType = [];

    config?.domain?.map((item: any) => {
      if (item.name === domain) {
        item?.usecase?.map((val) => {
          if (val.summary === usecase) {
            val.api?.map((apis) => {
              if (apis.name === seletedApi) {
                apis.examples?.map((ex) => {
                  filteredApiType.push({ key: ex.summary, value: ex.value });
                });
              }
            });
          }
        });
      }
    });

    setApiType(filteredApiType);
  };

  const getPayload = async (data: any) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/flow/examples`,
        {
          filePath: data,
        }
      );

      onLoadPayload(response.data);
    } catch (e) {
      console.log("Somthin went wrong: ", e);
      toast.error("Something went wrong while fetching payload");
    }
  };

  useEffect(() => {
    getPredefinedConfig();
  }, []);

  return (
    <div
      className={`bg-white pt-4 pr-4 pl-4 rounded shadow-lg mb-4 flex flex-row gap-4 grow`}
    >
      <FormSelect
        name="domain"
        label="Domain"
        options={domains}
        required
        register={register}
        errors={errors}
        disabled={domains.length === 0}
        setSelectedValue={(data) => {
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
        setSelectedValue={(data) => {
          getApi(data);
        }}
        nonSelectedValue
      />
      <FormSelect
        name="api"
        label="Api"
        options={apis}
        required
        register={register}
        errors={errors}
        nonSelectedValue
        disabled={apis.length === 0}
        setSelectedValue={(data: any) => {
          getType(data);
        }}
      />
      <FormSelect
        name="type"
        label="Type"
        options={apiType}
        required
        register={register}
        errors={errors}
        nonSelectedValue
        disabled={apiType.length === 0}
        setSelectedValue={(data: any) => {
          getPayload(data);
        }}
      />
    </div>
  );
};

export default FlowDetails;
