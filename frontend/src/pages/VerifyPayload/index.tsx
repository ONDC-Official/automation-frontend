import Header from "../../components/Header";

import { Container, RequestContainer, ResponseConatiner } from "./index.style";

const VerifyPayload = () => {
  return (
    <div>
      <Header title={"Automation UI"} />
      <Container>
        <RequestContainer>
          <h2>Request</h2>
          <pre
            id="editablePayloadData"
            contentEditable={true}
            // onInput={handleEditor}
            //  key={activeButton}
          ></pre>
        </RequestContainer>
        <ResponseConatiner>
          <h2>Response</h2>
        </ResponseConatiner>
      </Container>
    </div>
  );
};

export default VerifyPayload;
