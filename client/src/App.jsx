import React, { useEffect, useState } from "react";
import GameBoard from "../components/GameBoard";
import MoveOptions from "../components/MoveOptions";
import MoveHistory from "../components/MoveHistory";

function App() {
  const [boardState, setBoardState] = useState(
    Array(5)
      .fill()
      .map(() => Array(5).fill(null))
  );

  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isDeploying, setIsDeploying] = useState(true);
  const [deployedCount, setDeployedCount] = useState({
    A: { Pawn: 0, Hero1: 0, Hero2: 0 },
    B: { Pawn: 0, Hero1: 0, Hero2: 0 },
  });
  const [currentPlayer, setCurrentPlayer] = useState("A");
  const [availableMoves, setAvailableMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [webSocket, setWebSocket] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [roomName, setRoomName] = useState(null);

  useEffect(() => {
    const room_name = prompt("Enter room name to join:");
    setRoomName(room_name); // Save the room name to the state
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${room_name}/`);

    ws.onopen = () => {
      console.log("WebSocket connection established.");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message from WebSocket:", data);

      if (data.status === "Game does not exist") {
        // Create a new game if it doesn't exist
        ws.send(
          JSON.stringify({
            event: "initialize_game",
            opponent: prompt("Enter opponent's username:"),
          })
        );
      } else if (
        data.status === "Reconnected" ||
        data.status === "Game initialized"
      ) {
        setGameId(data.game_id);
        setBoardState(data.game_state.board);
        setCurrentPlayer(data.game_state.current_player);
        setMoveHistory(data.game_state.move_history);
      } else if (data.status === "Game joined") {
        setGameId(data.game_id);
        setBoardState(data.game_state.board);
        setCurrentPlayer(data.game_state.current_player);
        setMoveHistory(data.game_state.move_history);
      }

      if (data.move) {
        // Handle move updates here
        // Update the board state and other related states
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWebSocket(ws);

    // Clean up WebSocket connection on unmount
    return () => {
      ws.close();
    };
  }, []);

  const handleCellClick = (position) => {
    if (isDeploying) {
      handleDeployment(position);
    } else {
      handleMoveSelection(position);
    }
  };

  const handleDeployment = (position) => {
    if (!selectedCharacter) {
      alert("Please select a character to deploy.");
      return;
    }

    if (
      position.row !== (currentPlayer === "A" ? 0 : 4) ||
      boardState[position.row][position.col] !== null
    ) {
      alert("Invalid deployment position.");
      return;
    }

    const playerCount = deployedCount[currentPlayer];
    const maxLimit = selectedCharacter === "Pawn" ? 3 : 1;

    if (playerCount[selectedCharacter] < maxLimit) {
      const newBoardState = boardState.map((row) => row.slice());
      newBoardState[position.row][
        position.col
      ] = `${currentPlayer}-${selectedCharacter}`;

      setBoardState(newBoardState);

      setDeployedCount((prev) => ({
        ...prev,
        [currentPlayer]: {
          ...prev[currentPlayer],
          [selectedCharacter]: prev[currentPlayer][selectedCharacter] + 1,
        },
      }));

      setSelectedCharacter(null);

      const totalPlaced =
        playerCount.Pawn + playerCount.Hero1 + playerCount.Hero2 + 1;

      if (totalPlaced === 5) {
        if (currentPlayer === "A") {
          alert(
            "Player A has finished placing characters. It's now Player B's turn."
          );
          setCurrentPlayer("B");
        } else {
          startGame();
        }
      }
    } else {
      alert(`You can only place ${selectedCharacter} ${maxLimit} time(s).`);
    }
  };

  const startGame = () => {
    setIsDeploying(false);
    alert(
      "Both players have placed their characters. The game will now begin."
    );
  };

  const handleMoveSelection = (position) => {
    const clickedCharacter = boardState[position.row][position.col];
    if (clickedCharacter && clickedCharacter.startsWith(currentPlayer)) {
      setSelectedCharacter(position);
      const moves = calculateMoves(clickedCharacter, position);
      setAvailableMoves(moves);
    }
  };

  const handleMoveOptionClick = (move) => {
    if (selectedCharacter && webSocket) {
      const newPosition = calculateNewPosition(
        selectedCharacter,
        move,
        currentPlayer
      );
      if (newPosition) {
        webSocket.send(
          JSON.stringify({
            event: "move",
            game_id: gameId,
            character_id: selectedCharacter.id,
            move: move,
          })
        );
      } else {
        alert("Invalid move!");
      }
    }
  };

  const calculateMoves = (character, position) => {
    let potentialMoves = [];
    if (character.includes("Pawn")) {
      potentialMoves = ["L", "R", "F", "B"];
    } else if (character.includes("Hero1")) {
      potentialMoves = ["L2", "R2", "F2", "B2"];
    } else if (character.includes("Hero2")) {
      potentialMoves = ["FL", "FR", "BL", "BR"];
    }

    return potentialMoves.filter((move) => {
      const newPosition = calculateNewPosition(position, move, currentPlayer);

      if (newPosition === null) {
        return false;
      }

      const [newRow, newCol] = newPosition;

      if (character.includes("Hero1")) {
        const intermediatePosition = getIntermediatePosition(
          position,
          newPosition
        );
        if (intermediatePosition) {
          const [intermediateRow, intermediateCol] = intermediatePosition;
          const intermediateCell = boardState[intermediateRow][intermediateCol];

          if (intermediateCell && intermediateCell.startsWith(currentPlayer)) {
            return true;
          }

          if (
            intermediateCell &&
            intermediateCell.startsWith(currentPlayer === "A" ? "B" : "A")
          ) {
            return false;
          }
        }
      }

      const destination = boardState[newRow][newCol];
      if (destination && destination.startsWith(currentPlayer)) {
        return false;
      }

      return true;
    });
  };

  const calculateNewPosition = (position, move, currentPlayer) => {
    let newRow = position.row;
    let newCol = position.col;

    const isPlayerB = currentPlayer === "B";

    switch (move) {
      case "L":
        newCol += isPlayerB ? 1 : -1;
        break;
      case "R":
        newCol += isPlayerB ? -1 : 1;
        break;
      case "F":
        newRow += isPlayerB ? 1 : -1;
        break;
      case "B":
        newRow += isPlayerB ? -1 : 1;
        break;
      case "L2":
        newCol += isPlayerB ? 2 : -2;
        break;
      case "R2":
        newCol += isPlayerB ? -2 : 2;
        break;
      case "F2":
        newRow += isPlayerB ? 2 : -2;
        break;
      case "B2":
        newRow += isPlayerB ? -2 : 2;
        break;
      case "FL":
        newRow += isPlayerB ? 1 : -1;
        newCol += isPlayerB ? 1 : -1;
        break;
      case "FR":
        newRow += isPlayerB ? 1 : -1;
        newCol += isPlayerB ? -1 : 1;
        break;
      case "BL":
        newRow += isPlayerB ? -1 : 1;
        newCol += isPlayerB ? 1 : -1;
        break;
      case "BR":
        newRow += isPlayerB ? -1 : 1;
        newCol += isPlayerB ? -1 : 1;
        break;
      default:
        break;
    }

    if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
      return [newRow, newCol];
    } else {
      return null;
    }
  };

  const getIntermediatePosition = (start, end) => {
    const rowDiff = end[0] - start.row;
    const colDiff = end[1] - start.col;

    if (Math.abs(rowDiff) === 2 || Math.abs(colDiff) === 2) {
      const intermediateRow = start.row + rowDiff / 2;
      const intermediateCol = start.col + colDiff / 2;
      return [intermediateRow, intermediateCol];
    }

    return null;
  };

  return (
    <div className="App">
      <h1>
        {isDeploying
          ? `Deploy your characters (${currentPlayer})`
          : "Turn-based Game"}
      </h1>
      <GameBoard
        boardState={boardState}
        onCellClick={handleCellClick}
        isDeploying={isDeploying}
        selectedPosition={selectedCharacter}
        currentPlayer={currentPlayer}
      />
      {isDeploying && (
        <div>
          <p>Select a character to place on the board:</p>
          <button onClick={() => setSelectedCharacter("Pawn")}>Pawn</button>
          <button onClick={() => setSelectedCharacter("Hero1")}>Hero1</button>
          <button onClick={() => setSelectedCharacter("Hero2")}>Hero2</button>
        </div>
      )}
      {!isDeploying && availableMoves.length > 0 && (
        <MoveOptions
          options={availableMoves}
          onOptionClick={handleMoveOptionClick}
        />
      )}

      <MoveHistory history={moveHistory} />
    </div>
  );
}

export default App;
