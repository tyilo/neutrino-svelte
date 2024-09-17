<script lang="ts">
  import type { State, Player, Position } from "./game";
  import { Valuation, getValuationForMove } from "./valuation";
  import Cell from "./Cell.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let isHuman: [boolean, boolean];
  export let state: State;
  export let showValuations: boolean;

  let winner: Player | undefined;
  $: winner = state.getWinner();

  function canMoveFrom(state: State, [x, y]: Position): boolean {
    return winner === undefined && state.getPieceToMove() === state.cells[y][x];
  }

  async function getTargetValuation(
    state: State
  ): Promise<Valuation | undefined> {
    if (!showValuations) {
      return undefined;
    }
    return await getValuationForMove(state);
  }

  let canMoveTo: boolean[][];
  let targetValuations: Promise<Valuation | undefined>[][];
  function resetCanMoveTo() {
    canMoveTo = Array(5)
      .fill(undefined)
      .map(() => Array(5).fill(false));
    targetValuations = Array(5)
      .fill(undefined)
      .map(() => Array(5).fill(Promise.resolve(undefined)));
  }
  resetCanMoveTo();

  function handleMoveStart(e: CustomEvent) {
    resetCanMoveTo();
    for (let [x, y] of state.getValidMovesFrom(e.detail.from)) {
      canMoveTo[y][x] = true;
      targetValuations[y][x] = getTargetValuation(
        state.move([e.detail.from, [x, y]])
      );
    }
  }

  function handleMove(e: CustomEvent) {
    if (canMoveTo[e.detail.to[1]][e.detail.to[0]]) {
      state = state.move([e.detail.from, e.detail.to]);
      dispatch("move");
    }
  }

  function handleMoveEnd() {
    resetCanMoveTo();
  }

  const fives = [0, 1, 2, 3, 4];
</script>

{#if state}
  <table>
    {#each fives as y}
      <tr>
        <th>{5 - y}</th>
        {#each fives as x}
          <Cell
            piece={state.cells[y][x]}
            validMoveSource={canMoveFrom(state, [x, y])}
            movable={isHuman[state.currentPlayer]}
            validMoveTarget={canMoveTo[y][x]}
            targetValuation={targetValuations[y][x]}
            position={[x, y]}
            on:move={handleMove}
            on:moveStart={handleMoveStart}
            on:moveEnd={handleMoveEnd}
          />
        {/each}
      </tr>
    {/each}
    <tr>
      <th />
      {#each fives as x}
        <th>{String.fromCharCode("a".charCodeAt(0) + x)}</th>
      {/each}
    </tr>
  </table>
{/if}

<style>
  table {
    margin: auto;
    border-collapse: collapse;
  }

  tr:nth-child(even) :global(td):nth-child(odd),
  tr:nth-child(odd) :global(td):nth-child(even) {
    background-image: linear-gradient(0deg, #ccc, #ccc);
    background-blend-mode: multiply;
  }

  th {
    padding-left: 0.5em;
    padding-right: 0.5em;
  }
</style>
