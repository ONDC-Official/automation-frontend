import styled from "styled-components";

export const Container = styled.div`
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`;

export const RequestContainer = styled.div`
  border: 1px solid black;
  width: 45%;
`;

export const ResponseConatiner = styled.div`
  border: 1px solid red;
  width: 45%;
`;
