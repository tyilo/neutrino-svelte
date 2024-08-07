import type { State as BoardgameState, Ctx, LogEntry } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import { immerable } from "immer";
import produce from "immer";

export enum PIECE {
  None,
  White,
  Black,
  Neutrino,
}

const OPPOSITE_PIECE = new Map<PIECE, PIECE>();
OPPOSITE_PIECE.set(PIECE.White, PIECE.Black);
OPPOSITE_PIECE.set(PIECE.Black, PIECE.White);

const PLAYER_PIECE = new Map<number, PIECE>();
PLAYER_PIECE.set(0, PIECE.White);
PLAYER_PIECE.set(1, PIECE.Black);

const REVERSE_PLAYER_PIECE = new Map<PIECE, number>();
for (const [k, v] of PLAYER_PIECE.entries()) {
  REVERSE_PLAYER_PIECE.set(v, k);
}

const HOME_ROW = new Map<number, PIECE>();
HOME_ROW.set(0, PIECE.Black);
HOME_ROW.set(4, PIECE.White);

type Row = [PIECE, PIECE, PIECE, PIECE, PIECE];
export type Grid = [Row, Row, Row, Row, Row];

export type Position = [number, number];

type MoveType = {
  move: string;
  args: [Position, Position];
};

export class State {
  [immerable] = true;

  cells: Grid;
  movedNeutrino = false;

  constructor() {
    const cells = [];
    for (let y = 0; y < 5; y++) {
      cells.push(Array(5).fill(HOME_ROW.has(y) ? HOME_ROW.get(y) : PIECE.None));
    }
    cells[2][2] = PIECE.Neutrino;
    this.cells = cells as Grid;
  }
}

type StringGrid = [string, string, string, string, string];
export class StateWithPlayer {
  state: State;
  currentPlayer: string;

  constructor(state?: State, currentPlayer?: string) {
    if (!state) {
      state = new State();
    }
    if (!currentPlayer) {
      currentPlayer = "0";
    }
    this.state = state;
    this.currentPlayer = currentPlayer;
  }

  getWinner(): PIECE {
    return getWinner(this.state, this.currentPlayer);
  }

  getValidMoves(): StateWithPlayer[] {
    if (this.getWinner() !== null) return [];

    const res = [];
    const newPlayer = this.state.movedNeutrino
      ? (1 - parseInt(this.currentPlayer)).toString()
      : this.currentPlayer;
    for (const { args } of getValidMoves(this.state, this.currentPlayer)) {
      const newState = produce(this.state, (state) => {
        Neutrino.moves.move(
          state,
          { currentPlayer: this.currentPlayer } as any,
          args[0],
          args[1]
        );
      });
      res.push(new StateWithPlayer(newState, newPlayer));
    }
    return res;
  }

  serialize(): string {
    let res = BigInt(0);
    res |= BigInt(this.state.movedNeutrino) << BigInt(0);
    res |= BigInt(parseInt(this.currentPlayer)) << BigInt(1);

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        let i = y * 5 + x;
        res |= BigInt(this.state.cells[y][x] as number) << BigInt(2 * (i + 1));
      }
    }

    return res.toString();
  }

  static deserialize(str: string): StateWithPlayer {
    const n = BigInt(str);
    const state = new State();
    state.movedNeutrino = !!(n & BigInt(1));
    const currentPlayer = n & BigInt(0b10) ? "1" : "0";

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        let i = y * 5 + x;
        let k =
          (n & (BigInt(0b11) << BigInt(2 * (i + 1)))) >> BigInt(2 * (i + 1));
        state.cells[y][x] = Number(k) as PIECE;
      }
    }

    return new StateWithPlayer(state, currentPlayer);
  }

  getMoveToState(newState: StateWithPlayer): MoveType {
    const newSerialized = newState.serialize();
    const newPlayer = this.state.movedNeutrino
      ? (1 - parseInt(this.currentPlayer)).toString()
      : this.currentPlayer;

    for (let move of getValidMoves(this.state, this.currentPlayer)) {
      const stateWithoutPlayer = produce(this.state, (state) => {
        Neutrino.moves.move(
          state,
          { currentPlayer: this.currentPlayer } as any,
          move.args[0],
          move.args[1]
        );
      });

      const state = new StateWithPlayer(stateWithoutPlayer, newPlayer);

      if (state.serialize() === newSerialized) {
        return move;
      }
    }

    return null;
  }

  static PIECE_CHARS = (() => {
    let s = new Map<string, PIECE>();
    s.set(".", PIECE.None);
    s.set("W", PIECE.White);
    s.set("B", PIECE.Black);
    s.set("N", PIECE.Neutrino);
    return s;
  })();
  static fromArray(
    currentPlayer: string,
    movedNeutrino: boolean,
    cells: StringGrid
  ): StateWithPlayer {
    const state = new StateWithPlayer();
    state.currentPlayer = currentPlayer;
    state.state.movedNeutrino = movedNeutrino;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        state.state.cells[y][x] = this.PIECE_CHARS.get(cells[y][x]);
      }
    }
    return state;
  }
}

export const Neutrino = {
  setup: () => {
    return new State();
  },

  turn: {
    moveLimit: 2,
  },

  moves: {
    move: (G: State, ctx: Ctx, [x1, y1]: Position, [x2, y2]: Position) => {
      const expectedPiece = getPieceToMove(G, ctx.currentPlayer);

      if (G.cells[y1][x1] != expectedPiece) {
        console.error(`Expected: ${expectedPiece}`);
        return INVALID_MOVE;
      }

      if (
        !getValidMovesFrom(G.cells, [x1, y1]).some(
          (p) => p[0] == x2 && p[1] == y2
        )
      ) {
        return INVALID_MOVE;
      }

      G.cells[y2][x2] = G.cells[y1][x1];
      G.cells[y1][x1] = PIECE.None;

      G.movedNeutrino = !G.movedNeutrino;
    },
  },

  endIf: (G: State, ctx: Ctx) => {
    const winnerPiece = getWinner(G, ctx.currentPlayer);
    if (winnerPiece !== null) {
      return { winner: REVERSE_PLAYER_PIECE.get(winnerPiece).toString() };
    }
  },

  ai: {
    enumerate: (G: State, ctx: Ctx) => getValidMoves(G, ctx.currentPlayer),
  },
};

export function getPieceToMove(state: State, currentPlayer: string): PIECE {
  if (state.movedNeutrino) {
    return PLAYER_PIECE.get(parseInt(currentPlayer));
  } else {
    return PIECE.Neutrino;
  }
}

export function getValidMovesFrom(cells: Grid, [x, y]: Position): Position[] {
  const res = [];
  for (let dx = -1; dx < 2; dx++) {
    for (let dy = -1; dy < 2; dy++) {
      if (dx == 0 && dy == 0) continue;

      let nx = x;
      let ny = y;
      do {
        nx += dx;
        ny += dy;
      } while (
        0 <= nx &&
        nx < 5 &&
        0 <= ny &&
        ny < 5 &&
        cells[ny][nx] == PIECE.None
      );
      nx -= dx;
      ny -= dy;

      if (nx == x && ny == y) {
        continue;
      }

      let allHome = false;
      for (const [yHome, piece] of HOME_ROW.entries()) {
        if (ny == yHome && cells[y][x] == piece) {
          allHome = true;
          for (let xHome = 0; xHome < 5; xHome++) {
            allHome =
              allHome &&
              (cells[yHome][xHome] == piece || (xHome == nx && ny != y));
          }
        }
      }

      if (allHome) continue;

      res.push([nx, ny]);
    }
  }
  return res;
}

export function getValidMoves(state: State, currentPlayer: string): MoveType[] {
  const piece = getPieceToMove(state, currentPlayer);
  const moves = [];
  for (const posFrom of getPiecePositions(state.cells, piece)) {
    for (const posTo of getValidMovesFrom(state.cells, posFrom)) {
      moves.push({ move: "move", args: [posFrom, posTo] });
    }
  }
  return moves;
}

function getPiecePositions(cells: Grid, piece: PIECE): Position[] {
  const res = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      if (cells[y][x] == piece) {
        res.push([x, y]);
      }
    }
  }
  return res;
}

function getNeutrinoPosition(cells: Grid): Position {
  const pos = getPiecePositions(cells, PIECE.Neutrino);
  console.assert(pos.length == 1);
  return pos[0];
}

export function getWinner(state: State, currentPlayer: string): PIECE {
  const neutrinoPos = getNeutrinoPosition(state.cells);

  for (const [yHome, piece] of HOME_ROW.entries()) {
    if (neutrinoPos[1] == yHome) {
      return OPPOSITE_PIECE.get(piece);
    }
  }

  // currentPlayer is the player that has just moved,
  // not the player that should move now.
  // nextPlayer is the player that should move now.
  const nextPlayer = state.movedNeutrino
    ? parseInt(currentPlayer)
    : 1 - parseInt(currentPlayer);

  const playerPiece = PLAYER_PIECE.get(nextPlayer);
  if (getValidMoves(state, nextPlayer.toString()).length === 0) {
    return OPPOSITE_PIECE.get(playerPiece);
  }

  return null;
}

export type StateType = BoardgameState<State, Ctx> & {
  isActive: boolean;
  isConnected: boolean;
  log: LogEntry[];
};
