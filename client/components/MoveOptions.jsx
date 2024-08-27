import React from "react";
import styled from "styled-components";

const OptionsWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

const OptionButton = styled.button`
  background-color: #1f2937;
  color: white;
  border: none;
  margin: 0 5px;
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #3b82f6;
  }
`;

const MoveOptions = ({ options, onOptionClick }) => {
  return (
    <OptionsWrapper>
      {options.map((option) => (
        <OptionButton key={option} onClick={() => onOptionClick(option)}>
          {option}
        </OptionButton>
      ))}
    </OptionsWrapper>
  );
};

export default MoveOptions;
