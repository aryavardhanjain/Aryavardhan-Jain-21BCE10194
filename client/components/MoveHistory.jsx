import React from "react";
import styled from "styled-components";

const HistoryWrapper = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #1f2937;
  color: white;
  border-radius: 5px;
`;

const HistoryItem = styled.li`
  color: ${(props) => (props.isCapture ? "red" : "white")};
`;

const MoveHistory = ({ history }) => {
  return (
    <HistoryWrapper>
      <ul>
        {history.map((move, index) => (
          <HistoryItem key={index} isCapture={move.isCapture}>
            {move.text}
          </HistoryItem>
        ))}
      </ul>
    </HistoryWrapper>
  );
};

export default MoveHistory;
