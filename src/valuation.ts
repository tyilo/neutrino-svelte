import { Player, State } from "./game";

type StateInfo = {
  id: string;
  index: number;
  optimal_move_id: string | null;
  optimal_winner: string | null;
};

const CACHE = new Map<string, Promise<StateInfo>>();

async function fetchExternalInfo(id: string): Promise<StateInfo> {
  const url = new URL("https://api.neutrino.tyilo.com/info");
  url.searchParams.set("id", id);
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

export async function getExternalInfo(state: State): Promise<StateInfo> {
  const id = state.serialize();
  const cachedData = CACHE.get(id);
  if (cachedData) {
    return await cachedData;
  }
  const promise = fetchExternalInfo(id);
  CACHE.set(id, promise);
  return await promise;
}

export async function getOptimalWinner(state: State): Promise<Player | null> {
  const data = await getExternalInfo(state);
  switch (data.optimal_winner) {
    case null:
      return null;
    case "white":
      return Player.White;
    case "black":
      return Player.Black;
    default:
      throw new Error(`Unexpected optimal winner: ${data.optimal_winner}`);
  }
}

export enum Valuation {
  Loss,
  Neutral,
  Win,
}

export async function getValuationForMove(state: State): Promise<Valuation> {
  const winner = await getOptimalWinner(state);
  if (winner === null) {
    return Valuation.Neutral;
  }
  if (winner == state.previousMovePlayer()) {
    return Valuation.Win;
  } else {
    return Valuation.Loss;
  }
}
