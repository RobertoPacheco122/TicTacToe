import * as readline from "readline";
import * as fs from "fs";
import { ChartCallback, ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

interface GameResult {
  playerX: boolean;
  playerO: boolean;
  draw: boolean;
  moves: number;
}

class TicTacToe {
  private board: string[][];
  private currentPlayer: string;
  private rl: readline.Interface;

  constructor() {
    this.board = [
      ["-", "-", "-"],
      ["-", "-", "-"],
      ["-", "-", "-"],
    ];
    this.currentPlayer = "X";
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private printBoard(): void {
    console.log("");

    for (let i = 0; i < this.board.length; i++) {
      console.log(this.board[i].join(" | "));

      if (i < this.board.length - 1) console.log("---------");
    }

    console.log("");
  }

  private async makeMove(row: number, col: number): Promise<boolean> {
    if (this.board[row][col] === "-") {
      this.board[row][col] = this.currentPlayer;
      return true;
    }

    return false;
  }

  private checkForWinnerOnRows(): string | undefined {
    for (let i = 0; i < 3; i++) {
      if (
        this.board[i][0] === this.board[i][1] &&
        this.board[i][1] === this.board[i][2] &&
        this.board[i][0] !== "-"
      )
        return this.board[i][0];
    }

    return;
  }

  private checkForWinnerOnColumns(): string | undefined {
    for (let i = 0; i < 3; i++) {
      if (
        this.board[0][i] === this.board[1][i] &&
        this.board[1][i] === this.board[2][i] &&
        this.board[0][i] !== "-"
      )
        return this.board[0][i];
    }

    return;
  }

  private checkForWinnerOnDiagonals(): string | undefined {
    if (
      (this.board[0][0] === this.board[1][1] &&
        this.board[1][1] === this.board[2][2]) ||
      (this.board[0][2] === this.board[1][1] &&
        this.board[1][1] === this.board[2][0])
    ) {
      return this.board[1][1];
    }

    return;
  }

  private checkFowDraw(): string | undefined {
    let isDraw = true;
    for (let row of this.board) {
      for (let cell of row) {
        if (cell === "-") {
          isDraw = false;
          break;
        }
      }
    }

    if (isDraw) return "Empate";
  }

  private checkWinner(): string {
    const winnerOnRows = this.checkForWinnerOnRows();
    const winnerOnColumns = this.checkForWinnerOnColumns();
    const winnerOnDiagonals = this.checkForWinnerOnDiagonals();
    const draw = this.checkFowDraw();

    if (winnerOnRows) return winnerOnRows;
    if (winnerOnColumns) return winnerOnColumns;
    if (winnerOnDiagonals) return winnerOnDiagonals;
    if (draw) return draw;

    return "-";
  }

  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
  }

  private getRandomMove(): [number, number] {
    const availableMoves: [number, number][] = [];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.board[i][j] === "-") {
          availableMoves.push([i, j]);
        }
      }
    }

    const randomIndex = Math.floor(Math.random() * availableMoves.length);

    return availableMoves[randomIndex];
  }

  private checkIfUserInputIsInvalid(row: number, col: number): boolean {
    if (isNaN(row) || isNaN(col) || row < 0 || row > 2 || col < 0 || col > 2)
      return true;

    return false;
  }

  private getBestMove(): [number, number] {
    let bestMove: [number, number] = [-1, -1];
    let bestScore = -Infinity;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.board[i][j] === "-") {
          this.board[i][j] = "O";
          const score = this.minimax(0, false);
          this.board[i][j] = "-";
          if (score > bestScore) {
            bestScore = score;
            bestMove = [i, j];
          }
        }
      }
    }

    return bestMove;
  }

  private minimax(depth: number, isMaximizing: boolean): number {
    const winner = this.checkWinner();
    if (winner !== "-") {
      return winner === "O" ? 1 : winner === "X" ? -1 : 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (this.board[i][j] === "-") {
            this.board[i][j] = "O";
            const score = this.minimax(depth + 1, false);
            this.board[i][j] = "-";
            bestScore = Math.max(bestScore, score);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (this.board[i][j] === "-") {
            this.board[i][j] = "X";
            const score = this.minimax(depth + 1, true);
            this.board[i][j] = "-";
            bestScore = Math.min(bestScore, score);
          }
        }
      }
      return bestScore;
    }
  }

  public async playAgainstEachOther(): Promise<string> {
    let gameResult = "";

    while (true) {
      this.printBoard();

      const row = await this.questionAsync(
        `${this.currentPlayer}, escolha a linha (0-2): `
      );
      const col = await this.questionAsync(
        `${this.currentPlayer}, escolha a coluna (0-2): `
      );

      const rowNumber = parseInt(row, 10);
      const colNumber = parseInt(col, 10);

      if (this.checkIfUserInputIsInvalid(rowNumber, colNumber)) {
        console.log("Escolha inválida. Tente novamente.");
        continue;
      }

      if (!this.makeMove(rowNumber, colNumber)) {
        console.log("Essa posição já está ocupada. Tente novamente.");
        continue;
      }

      const winner = this.checkWinner();
      if (winner !== "-") {
        this.printBoard();

        gameResult =
          winner === "X"
            ? "O jogador X ganhou!"
            : winner === "O"
            ? "O jogador O ganhou!"
            : "Houve um empate!";

        break;
      }

      this.switchPlayer();
    }

    this.rl.close();

    return gameResult;
  }

  public async playAgainstDumbPlayer(): Promise<string> {
    let gameResult = "";

    while (true) {
      this.printBoard();

      if (this.currentPlayer === "O") {
        const [row, col] = this.getRandomMove();
        this.makeMove(row, col);
      } else {
        const row = await this.questionAsync(
          `${this.currentPlayer}, escolha a linha (0-2): `
        );
        const col = await this.questionAsync(
          `${this.currentPlayer}, escolha a coluna (0-2): `
        );

        const rowNumber = parseInt(row, 10);
        const colNumber = parseInt(col, 10);

        if (this.checkIfUserInputIsInvalid(rowNumber, colNumber)) {
          console.log("Escolha inválida. Tente novamente.");
          continue;
        }

        if (!this.makeMove(rowNumber, colNumber)) {
          console.log("Essa posição já está ocupada. Tente novamente.");
          continue;
        }
      }

      const winner = this.checkWinner();
      if (winner !== "-") {
        this.printBoard();

        gameResult =
          winner === "X"
            ? "O jogador X ganhou!"
            : winner === "O"
            ? "O jogador O ganhou!"
            : "Houve um empate!";

        break;
      }

      this.switchPlayer();
    }

    this.rl.close();

    return gameResult;
  }

  public playDumbAgainstDumbPlayer(showGameResultBoard: boolean): GameResult {
    let gameResult = "";
    let moves = 0;

    while (true) {
      const [row, col] = this.getRandomMove();
      this.makeMove(row, col);

      moves += 1;

      const winner = this.checkWinner();
      if (winner !== "-") {
        if (showGameResultBoard) this.printBoard();

        gameResult =
          winner === "X"
            ? "O jogador X ganhou!"
            : winner === "O"
            ? "O jogador O ganhou!"
            : "Houve um empate!";

        break;
      }

      this.switchPlayer();
    }

    this.rl.close();

    return {
      playerX: gameResult === "O jogador X ganhou!" ? true : false,
      playerO: gameResult === "O jogador O ganhou!" ? true : false,
      draw: gameResult === "Houve um empate!" ? true : false,
      moves: moves,
    };
  }

  public async playAgainstUnbeatablePlayer(): Promise<string> {
    let gameResult = "";

    while (true) {
      this.printBoard();

      if (this.currentPlayer === "O") {
        // Se for a vez do jogador O (máquina), usamos o algoritmo Minimax para fazer a melhor jogada
        const [row, col] = this.getBestMove();
        this.makeMove(row, col);
      } else {
        // Se for a vez do jogador X (humano), solicitamos a entrada do usuário
        const row = await this.questionAsync(
          `${this.currentPlayer}, escolha a linha (0-2): `
        );
        const col = await this.questionAsync(
          `${this.currentPlayer}, escolha a coluna (0-2): `
        );

        const rowNumber = parseInt(row, 10);
        const colNumber = parseInt(col, 10);

        if (this.checkIfUserInputIsInvalid(rowNumber, colNumber)) {
          console.log("Escolha inválida. Tente novamente.");
          continue;
        }

        if (!this.makeMove(rowNumber, colNumber)) {
          console.log("Essa posição já está ocupada. Tente novamente.");
          continue;
        }
      }

      const winner = this.checkWinner();
      if (winner !== "-") {
        this.printBoard();

        gameResult =
          winner === "X"
            ? "O jogador X ganhou!"
            : winner === "O"
            ? "O jogador O ganhou!"
            : "Houve um empate!";

        break;
      }

      this.switchPlayer();
    }

    this.rl.close();

    return gameResult;
  }

  public playUnbeatableAgaintUnbeatablePlayer(
    showGameResultBoard: boolean
  ): GameResult {
    let gameResult = "";
    let moves = 0;

    while (true) {
      const [row, col] = this.getBestMove();
      this.makeMove(row, col);

      moves += 1;

      const winner = this.checkWinner();
      if (winner !== "-") {
        if (showGameResultBoard) this.printBoard();

        gameResult =
          winner === "X"
            ? "O jogador X ganhou!"
            : winner === "O"
            ? "O jogador O ganhou!"
            : "Houve um empate!";

        break;
      }

      this.switchPlayer();
    }

    this.rl.close();

    return {
      playerX: gameResult === "O jogador X ganhou!" ? true : false,
      playerO: gameResult === "O jogador O ganhou!" ? true : false,
      draw: gameResult === "Houve um empate!" ? true : false,
      moves: moves,
    };
  }

  private questionAsync(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

const generateMultipleGamesResult = (gamesQuantity: number): GameResult[] => {
  const result: GameResult[] = [];

  let gameIndex = 1;

  while (gameIndex <= gamesQuantity) {
    const game = new TicTacToe();
    const gameResult = game.playDumbAgainstDumbPlayer(false);

    result.push(gameResult);

    gameIndex += 1;
  }

  return result;
};

const generateGamesResultsFile = (results: GameResult[]) => {
  fs.writeFileSync("results.json", JSON.stringify(results), "utf8");

  console.log("");
  console.log("Arquivo de resultados gerados com sucesso!");
};

const countResults = (results: GameResult[]) => {
  let playerXWins = 0;
  let playerOWins = 0;
  let draws = 0;

  results.forEach((result) => {
    if (result.playerX) {
      playerXWins++;
    } else if (result.playerO) {
      playerOWins++;
    } else if (result.draw) {
      draws++;
    }
  });

  console.log("");
  console.log("==============================");
  console.log(`Vitórias Jogador X = ${playerXWins}`);
  console.log(`Vitórias Jogador O = ${playerOWins}`);
  console.log(`Empates = ${draws}`);
  console.log("==============================");
  console.log("");

  return { playerXWins, playerOWins, draws };
};

const generateGraphicImageFromResults = async (results: GameResult[]) => {
  const width = 400;
  const height = 400;

  const { playerXWins, playerOWins, draws } = countResults(results);

  const configuration: ChartConfiguration = {
    type: "bar",
    data: {
      labels: ["Jogador X", "Jogador O", "Empate"],
      datasets: [
        {
          label: "Resultados das partidas",
          data: [playerXWins, playerOWins, draws],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
          ],
          borderColor: [
            "rgba(255,99,132,1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {},
    plugins: [
      {
        id: "background-colour",
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        },
      },
    ],
  };

  const chartCallback: ChartCallback = (ChartJS) => {
    ChartJS.defaults.responsive = true;
    ChartJS.defaults.maintainAspectRatio = false;
  };

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    chartCallback,
  });

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

  fs.writeFileSync("resultsImage.png", buffer, "base64");

  console.log("Gráfico gerado ccom sucesso!");
};

const initGame = async () => {
  const results = generateMultipleGamesResult(10000);

  generateGamesResultsFile(results);

  await generateGraphicImageFromResults(results);

  const game = new TicTacToe();

  game.playAgainstUnbeatablePlayer();
};

initGame();
