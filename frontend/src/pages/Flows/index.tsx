import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header";

import {
  FlowContainer,
  FlowWrapper,
  Container,
  StartButton,
  SubHeader,
} from "./index.style";

interface ISequence {
  [key: string]: string;
}

interface IFLow {
  id: String;
  description: String;
  sequence: ISequence;
}

const Flows = () => {
  const [flows, setFlows] = useState<IFLow[] | null>([]);
  const [selectedIndex, setSelectedIndex] = useState<Number | null>(null);
  const navigate = useNavigate();

  const getFlows = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/flow`,
      {}
    );

    console.log("Response flow list", response.data);

    setFlows(response.data.domain[0].flows);
  };

  const selectFlow = async (id: String) => {
    const data = {
      flowId: id,
    };

    const session = JSON.parse(localStorage.getItem("session") || "{}");

    console.log("session", session.subscriberUrl);

    var config = {
      method: "put",
      url: `${import.meta.env.VITE_BACKEND_URL}/sessions?subscriber_url=${
        session.subscriberUrl
      }`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
        navigate("/transaction");
      })
      .catch(function (error) {
        console.log("Somrhignwen t rn", error);
      });
  };

  useEffect(() => {
    getFlows();
  }, []);

  return (
    <Container>
      <Header title="Automation UI" />

      <SubHeader>Flows</SubHeader>
      <FlowWrapper>
        {flows?.map((flow, index) => (
          <FlowContainer
            selected={index === selectedIndex}
            onClick={() => setSelectedIndex(index)}
          >
            <div>
              <h3>{flow.id}</h3>
              <p>{flow.description}</p>
              <p>{JSON.stringify(flow.sequence)}</p>
            </div>
            <StartButton onClick={() => selectFlow(flow.id)}>Start</StartButton>
          </FlowContainer>
        ))}
      </FlowWrapper>
    </Container>
  );
};

export default Flows;
