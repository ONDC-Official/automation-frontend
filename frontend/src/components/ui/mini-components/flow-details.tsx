import FormSelect from "./../forms/form-select";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

const EXAMPLE = {
  context: {
    location: {
      country: {
        code: "IND",
      },
      city: {
        code: "std:011",
      },
    },
    domain: "ONDC:TRV11",
    timestamp: "2023-03-23T04:41:16.000Z",
    bap_id: "api.example-bap.com",
    transaction_id: "6743e9e2-4fb5-487c-92b7-13ba8018f176",
    message_id: "6743e9e2-4fb5-487c-92b7-13ba8018f176",
    version: "2.0.1",
    action: "search",
    bap_uri: "https://api.example-bap.com/ondc/metro",
    ttl: "PT30S",
  },
  message: {
    intent: {
      fulfillment: {
        vehicle: {
          category: "METRO",
        },
      },
      payment: {
        collected_by: "BAP",
        tags: [
          {
            descriptor: {
              code: "BUYER_FINDER_FEES",
            },
            display: false,
            list: [
              {
                descriptor: {
                  code: "BUYER_FINDER_FEES_PERCENTAGE",
                },
                value: "1",
              },
            ],
          },
          {
            descriptor: {
              code: "SETTLEMENT_TERMS",
            },
            display: false,
            list: [
              {
                descriptor: {
                  code: "DELAY_INTEREST",
                },
                value: "2.5",
              },
              {
                descriptor: {
                  code: "STATIC_TERMS",
                },
                value: "https://api.example-bap.com/booking/terms",
              },
            ],
          },
        ],
      },
    },
  },
};

const FlowDetails = ({ onLoadPayload }) => {
  const {
    register,
    formState: { errors },
  } = useForm();
  const [domains, setDomains] = useState([]);
  const [usecase, setUsecase] = useState([]);
  const [api, setApi] = useState([]);
  const [type, setType] = useState([]);

  const getDomains = () => {
    // api call
    setDomains(["ONDC:TRV11", "ONDC:FIS12"]);
  };

  const getUsecase = (selectedDomain) => {
    // api call
    if (selectedDomain === "ONDC:TRV11") {
      setUsecase(["metro station code", "metro gps"]);
      return;
    }

    if (selectedDomain === "ONDC:FIS12") {
      setUsecase(["invoice loan", "personal laon"]);
      return;
    }
  };

  const getApi = (selectedUsecase) => {
    setApi(["search", "select", "init"]);
  };

  const getPayload = (_data: any) => {
    // api call
    onLoadPayload(EXAMPLE);
  };

  useEffect(() => {
    getDomains();
  }, []);

  return (
    <div
      className={` bg-white pt-4 pr-4 pl-4 rounded shadow-lg mb-4 flex flex-row gap-4 grow`}
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
        options={usecase}
        required
        register={register}
        errors={errors}
        disabled={usecase.length === 0}
        setSelectedValue={(data) => {
          getApi(data);
        }}
        nonSelectedValue
      />
      <FormSelect
        name="api"
        label="Api"
        options={api}
        required
        register={register}
        errors={errors}
        nonSelectedValue
        disabled={api.length === 0}
        setSelectedValue={(data: any) => {
          getPayload(data);
        }}
      />
      <FormSelect
        name="type"
        label="Type"
        options={type}
        required
        register={register}
        errors={errors}
        nonSelectedValue
        disabled={type.length === 0}
        setSelectedValue={(data: any) => {
          // getPayload(data);
        }}
      />
    </div>
  );
};

export default FlowDetails;
