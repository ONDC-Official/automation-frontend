import styled from "styled-components";

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const InputConatiner = styled.input`
  width: calc(100% - 18px);
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const SelectConatiner = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const ErrorText = styled.p`
  margin: 0px;
  padding: 0px;
  color: red;
  font-size: 14px;
`;

export const Button = styled.button`
  padding: 10px;
  background-color: #6200ea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #4700ab;
  }
`;

export const Lable = styled.label`
  display: inline-block;
  margin-bottom: 5px;
  font-size: 14px;
`;
