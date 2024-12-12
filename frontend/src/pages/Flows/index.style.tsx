import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FlowWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex: 1;
  overflow-y: scroll;
`;
export const FlowContainer = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #f2f2f2;
  padding: 10px;
  width: 70%;
  border-bottom: 1px solid #b3b3b3;
`;

export const StartButton = styled.div`
  padding: 10px 20px;
  background-color: #6200ea;
  color: white;
  border-radius: 5px;

  &:hover {
    background-color: #4700ab;
  }
`;

export const SubHeader = styled.h2`
  margin-left: 10px;
`;
