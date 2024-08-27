import React from "react";
import styled from "styled-components";

const CellWrapper = styled.div`
  background-color: ${(props) => (props.isEmpty ? "#222" : "#333")};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 1px solid #444;
  cursor: pointer;
  ${(props) => props.isSelected && "background-color: #3b82f6;"}
`;

const Cell = ({ position, value, onClick, isSelected }) => {
  const isEmpty = !value;

  return (
    <CellWrapper
      isEmpty={isEmpty}
      onClick={() => onClick(position)}
      isSelected={isSelected}
    >
      {value && <span>{value}</span>}
    </CellWrapper>
  );
};

export default Cell;
