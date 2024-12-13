import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  InputConatiner,
  Button,
  FormContainer,
  ErrorText,
  SelectConatiner,
  Lable,
} from "./index.style";

const MetaDataForm = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();

  const createSession = async (data: any) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/sessions`,
        data
      );
      console.log("response", response.data);

      localStorage.setItem("session", JSON.stringify(data));

      navigate("/flows");
    } catch (e) {
      console.log("somthing went weron", e);
    }
  };

  const onSubmit = (data: any) => {
    console.log("Form Data: ", data);

    createSession(data);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Session Form</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormContainer>
          <div>
            <Lable htmlFor="city">City</Lable>
            <Controller
              name="city"
              control={control}
              defaultValue="" // Default value
              rules={{ required: "City is required" }} // Validation rules
              render={({ field }: any) => (
                <SelectConatiner {...field}>
                  <option disabled value="">
                    -- Select an option --
                  </option>
                  <option value="std:080">std:080</option>
                </SelectConatiner>
              )}
            />
            {errors.city && (
              <ErrorText>{errors.city.message?.toString()}</ErrorText>
            )}
          </div>

          <div>
            <Lable htmlFor="domain">Domain</Lable>
            <Controller
              name="domain"
              control={control}
              defaultValue="" // Default value
              rules={{ required: "Domain is required" }} // Validation rules
              render={({ field }: any) => (
                <SelectConatiner {...field}>
                  <option disabled value="">
                    -- Select an option --
                  </option>
                  <option value="ONDC:TRV:11">ONDC:TRV:11</option>
                </SelectConatiner>
              )}
            />
            {errors.domain && (
              <ErrorText>{errors.domain.message?.toString()}</ErrorText>
            )}
          </div>

          <div>
            <Lable htmlFor="participantType">Participant Type</Lable>
            <Controller
              name="participantType"
              control={control}
              defaultValue="" // Default value
              rules={{ required: "Participant Type is required" }} // Validation rules
              render={({ field }: any) => (
                <SelectConatiner {...field}>
                  <option disabled value="">
                    -- Select an option --
                  </option>
                  <option value="BAP">BAP</option>
                  <option value="BPP">BPP</option>
                </SelectConatiner>
              )}
            />
            {errors.participantType && (
              <ErrorText>
                {errors.participantType.message?.toString()}
              </ErrorText>
            )}
          </div>

          <div>
            <Lable htmlFor="subscriberId">Subscriber Id</Lable>
            <InputConatiner
              id="subscriberId"
              {...register("subscriberId", {
                required: "Subscriber Id is required",
              })}
            />
            {errors.subscriberId && (
              <ErrorText>{errors.subscriberId.message?.toString()}</ErrorText>
            )}
          </div>

          <div>
            <Lable htmlFor="subscriberUrl">Subscriber Url</Lable>
            <InputConatiner
              id="subscriberUrl"
              {...register("subscriberUrl", {
                required: "Subscriber Url is required",
              })}
            />
            {errors.subscriberUrl && (
              <ErrorText>{errors.subscriberUrl.message?.toString()}</ErrorText>
            )}
          </div>

          <div>
            <Lable htmlFor="version">Version</Lable>
            <Controller
              name="version"
              control={control}
              defaultValue="" // Default value
              rules={{ required: "Version is required" }} // Validation rules
              render={({ field }: any) => (
                <SelectConatiner {...field}>
                  <option disabled value="">
                    -- Select an option --
                  </option>
                  <option value="2.0.1">2.0.1</option>
                </SelectConatiner>
              )}
            />
            {errors.version && (
              <ErrorText>{errors.version.message?.toString()}</ErrorText>
            )}
          </div>

          <Button type="submit">Submit</Button>
        </FormContainer>
      </form>
    </div>
  );
};

export default MetaDataForm;
