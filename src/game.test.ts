import { PIECE, State, Neutrino, getValidMoves, getWinner } from "./game";
import produce from "immer";

class StateWithPlayer {
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
    return `${this.currentPlayer},${Number(
      this.state.movedNeutrino
    )},${this.state.cells.join(",")}`;
  }

  static deserialize(s: string): StateWithPlayer {
    const parts = s.split(",");
    const currentPlayer = parts[0];
    const state = new State();
    state.movedNeutrino = parts[1] === "1";

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        state.cells[y][x] = parseInt(parts[2 + y * 5 + x]);
      }
    }

    return new StateWithPlayer(state, currentPlayer);
  }
}

test("Serialize", () => {
  let s = new StateWithPlayer();
  let serialized = s.serialize();
  let deserialized = StateWithPlayer.deserialize(serialized);
  let serialized2 = deserialized.serialize();

  expect(serialized).toBe(serialized2);
});

test("Valid moves", () => {
  const EXPECTED_UNIQUE_STATES = [1, 8, 95, 197, 1950, 3701];

  let set = new Set<string>();
  set.add(new StateWithPlayer().serialize());

  for (let expected of EXPECTED_UNIQUE_STATES) {
    if (expected === 1) continue;

    let newSet = new Set<string>();
    for (let serialized of set) {
      const s = StateWithPlayer.deserialize(serialized);
      for (let s2 of s.getValidMoves()) {
        newSet.add(s2.serialize());
      }
    }

    set = newSet;
    expect(set.size).toBe(expected);
  }
});
