import React from "react";
import styled from "styled-components";
import Cell from "./Cell";

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 5px;
  width: 300px;
  height: 300px;
  margin: 20px auto;
  border: 2px solid #333;
`;

const GameBoard = ({
  boardState,
  onCellClick,
  isDeploying,
  selectedPosition,
  currentPlayer,
}) => {
  return (
    <Board>
      {boardState.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            position={{ row: rowIndex, col: colIndex }}
            value={cell}
            onClick={() =>
              isDeploying
                ? (rowIndex === 0 || rowIndex === 4) &&
                  onCellClick({ row: rowIndex, col: colIndex })
                : onCellClick({ row: rowIndex, col: colIndex })
            }
            isSelected={
              selectedPosition &&
              selectedPosition.row === rowIndex &&
              selectedPosition.col === colIndex
            }
          />
        ))
      )}
    </Board>
  );
};

export default GameBoard;
