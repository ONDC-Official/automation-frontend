import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import { QontoConnector } from "./verticalSteps";
import { StepContent, StepperWrapper, LoaderText } from "./index.style";

import Header from "../../components/Header";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const Flow = () => {
  const [sessionData, setSessionData] = useState<any>([]);
  const [sessionId, setSessionId] = useState<String>("");
  const triggerSearchInitalited = useRef(false);

  const activeStep = 0;

  const generateReport = async () => {
    console.log("sessionData.active_session_id", sessionId);
    try {
      const response = await axios.get(
        `http://localhost:4000/flow/report?sessionId=${sessionId}`
      );

      const reporthtml = response.data.data;

      console.log("responehtml", reporthtml);

      const newTab = window.open();

      if (newTab) {
        // Write the HTML content to the new tab
        newTab.document.open();
        newTab.document.write(reporthtml);
        // newTab.document.close();
      } else {
        alert("Unable to open a new tab. Please check your browser settings.");
      }
    } catch (e) {
      console.log("somthing ernt wrong");
    }
  };

  const getUpdatedSession = async () => {
    try {
      const session = JSON.parse(localStorage.getItem("session") || "{}");

      const response = await axios.get(
        `http://localhost:4000/sessions?subscriber_url=${session.subscriberUrl}`
      );

      console.log("response updated csession", response.data);
      setSessionData(response.data.session_payloads?.flow_id || []);
      setSessionId(response.data.active_session_id);
    } catch (e) {
      console.log("wokring >>>>>>", e);
    }
  };

  const triggerSearch = async () => {
    const session = JSON.parse(localStorage.getItem("session") || "");

    if (session.participantType === "BAP") {
      return;
    }

    try {
      const data = {
        subscriberUrl: session?.subscriberUrl,
        initiateSearch: true,
      };

      const response = await axios.post(
        "http://localhost:4000/flow/trigger",
        data
      );

      console.log("reponse", response);
    } catch (e) {
      console.log("errror", e);
    }
  };

  useEffect(() => {
    getUpdatedSession();
    setInterval(() => {
      getUpdatedSession();
    }, 3000);
  }, []);

  useEffect(() => {
    if (!triggerSearchInitalited.current) triggerSearch();

    return () => {
      triggerSearchInitalited.current = true;
    };
  }, []);

  return (
    <div>
      <Header
        title="Automation UI"
        buttonTitle={"Generate Report"}
        onButtonClick={() => generateReport()}
      />

      {!sessionData.length && <LoaderText>Fetching calls...</LoaderText>}

      <StepperWrapper>
        <Stepper
          orientation="vertical"
          activeStep={activeStep}
          connector={<QontoConnector />}
        >
          {sessionData?.map((session: any) => {
            return (
              <Step>
                <StepLabel>{session.request.action}</StepLabel>

                <StepContent>
                  <div>{`Request:  ${JSON.stringify(session.request)}`}</div>
                  <br />
                  {session.response && (
                    <div>{`Response: ${JSON.stringify(session.response)}`}</div>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </StepperWrapper>
    </div>
  );
};

export default Flow;
