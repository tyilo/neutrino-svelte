export enum Player {
  White,
  Black,
}

export enum Piece {
  None,
  White,
  Black,
  Neutrino,
}

function oppositePlayer(player: Player): Player {
  switch (player) {
    case Player.White:
      return Player.Black;
    case Player.Black:
      return Player.White;
  }
}

function toPiece(player: Player): Piece {
  switch (player) {
    case Player.White:
      return Piece.White;
    case Player.Black:
      return Piece.Black;
  }
}

const HOME_ROW = new Map<number, Player>();
HOME_ROW.set(0, Player.Black);
HOME_ROW.set(4, Player.White);

type Row = [Piece, Piece, Piece, Piece, Piece];
export type Grid = [Row, Row, Row, Row, Row];

export type Position = [number, number];
export type Move = [Position, Position];

type StringGrid = [string, string, string, string, string];
export class State {
  cells: Grid;
  movedNeutrino: boolean;
  currentPlayer: Player;

  constructor() {
    const cells: Piece[][] = [];
    for (let y = 0; y < 5; y++) {
      const player = HOME_ROW.get(y);
      cells.push(
        Array(5).fill(player === undefined ? Piece.None : toPiece(player))
      );
    }
    cells[2][2] = Piece.Neutrino;
    this.cells = cells as Grid;
    this.movedNeutrino = false;
    this.currentPlayer = Player.White;
  }

  clone(): State {
    const clone = new State();
    clone.cells = this.cells.map((row) => row.slice()) as Grid;
    clone.movedNeutrino = this.movedNeutrino;
    clone.currentPlayer = this.currentPlayer;
    return clone;
  }

  getWinner(): Player | undefined {
    const neutrinoPos = this.getNeutrinoPosition();

    for (const [yHome, player] of HOME_ROW.entries()) {
      if (neutrinoPos[1] == yHome) {
        return oppositePlayer(player);
      }
    }

    if (this.getValidMovesIfNoWinner().length === 0) {
      return oppositePlayer(this.currentPlayer);
    }

    return undefined;
  }

  getValidNextStates(): State[] {
    return this.getValidMoves().map((move) => this.move(move));
  }

  getPieceToMove(): Piece {
    if (this.movedNeutrino) {
      return toPiece(this.currentPlayer);
    } else {
      return Piece.Neutrino;
    }
  }

  getValidMovesFrom([x, y]: Position): Position[] {
    const res: Position[] = [];
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
          this.cells[ny][nx] == Piece.None
        );
        nx -= dx;
        ny -= dy;

        if (nx == x && ny == y) {
          continue;
        }

        let allHome = false;
        for (const [yHome, player] of HOME_ROW.entries()) {
          if (ny == yHome && this.cells[y][x] == toPiece(player)) {
            allHome = true;
            for (let xHome = 0; xHome < 5; xHome++) {
              allHome =
                allHome &&
                (this.cells[yHome][xHome] == toPiece(player) ||
                  (xHome == nx && ny != y));
            }
          }
        }

        if (allHome) continue;

        res.push([nx, ny]);
      }
    }
    return res;
  }

  getValidMoves(): Move[] {
    if (this.getWinner() !== undefined) return [];
    return this.getValidMovesIfNoWinner();
  }

  getValidMovesIfNoWinner(): Move[] {
    const piece = this.getPieceToMove();
    const moves: Move[] = [];
    for (const posFrom of this.getPiecePositions(piece)) {
      for (const posTo of this.getValidMovesFrom(posFrom)) {
        moves.push([posFrom, posTo]);
      }
    }
    return moves;
  }

  move([start, end]: Move): State {
    const state = this.clone();
    state.cells[end[1]][end[0]] = state.cells[start[1]][start[0]];
    state.cells[start[1]][start[0]] = Piece.None;
    if (state.movedNeutrino) {
      state.currentPlayer = oppositePlayer(this.currentPlayer);
    }
    state.movedNeutrino = !state.movedNeutrino;
    return state;
  }

  getPiecePositions(piece: Piece): Position[] {
    const res: Position[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (this.cells[y][x] == piece) {
          res.push([x, y]);
        }
      }
    }
    return res;
  }

  getNeutrinoPosition(): Position {
    const pos = this.getPiecePositions(Piece.Neutrino);
    console.assert(pos.length == 1);
    return pos[0];
  }

  serialize(): string {
    let res = BigInt(0);
    res |= BigInt(this.movedNeutrino) << BigInt(0);
    res |= BigInt(this.currentPlayer === Player.Black) << BigInt(1);

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        let i = y * 5 + x;
        res |= BigInt(this.cells[y][x] as number) << BigInt(2 * (i + 1));
      }
    }

    return res.toString();
  }

  static deserialize(str: string): State {
    const n = BigInt(str);
    const state = new State();
    state.movedNeutrino = !!(n & BigInt(1));
    state.currentPlayer = n & BigInt(0b10) ? Player.Black : Player.White;

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        let i = y * 5 + x;
        let k =
          (n & (BigInt(0b11) << BigInt(2 * (i + 1)))) >> BigInt(2 * (i + 1));
        state.cells[y][x] = Number(k) as Piece;
      }
    }

    return state;
  }

  static PIECE_CHARS = (() => {
    let s = new Map<string, Piece>();
    s.set(".", Piece.None);
    s.set("W", Piece.White);
    s.set("B", Piece.Black);
    s.set("N", Piece.Neutrino);
    return s;
  })();
  static fromArray(
    currentPlayer: Player,
    movedNeutrino: boolean,
    cells: StringGrid
  ): State {
    const state = new State();
    state.currentPlayer = currentPlayer;
    state.movedNeutrino = movedNeutrino;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        state.cells[y][x] = this.PIECE_CHARS.get(cells[y][x])!;
      }
    }
    return state;
  }
}
