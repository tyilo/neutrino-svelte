<script lang="ts">
  import type { State, Player, Position } from "./game";
  import Cell from "./Cell.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let isHuman: [boolean, boolean];
  export let state: State;

  let winner: Player | undefined;
  $: winner = state.getWinner();

  function canMoveFrom(state: State, [x, y]: Position): boolean {
    return winner === undefined && state.getPieceToMove() === state.cells[y][x];
  }

  function canMoveTo(
    _state: State,
    validMoveTargets: Position[],
    [x, y]: Position
  ): boolean {
    return validMoveTargets.some((p) => p[0] === x && p[1] === y);
  }

  let validMoveTargets: Position[] = [];
  function handleMoveStart(e: CustomEvent) {
    validMoveTargets = state.getValidMovesFrom(e.detail.from);
  }

  function handleMove(e: CustomEvent) {
    if (canMoveTo(state, validMoveTargets, e.detail.to)) {
      state = state.move([e.detail.from, e.detail.to]);
      dispatch("move");
    }
  }

  function handleMoveEnd() {
    validMoveTargets = [];
  }

  const fives = [0, 1, 2, 3, 4];
</script>

{#if state}
  <table>
    {#each fives as y}
      <tr>
        {#each fives as x}
          <Cell
            piece={state.cells[y][x]}
            validMoveSource={canMoveFrom(state, [x, y])}
            movable={isHuman[state.currentPlayer]}
            validMoveTarget={canMoveTo(state, validMoveTargets, [x, y])}
            position={[x, y]}
            on:move={handleMove}
            on:moveStart={handleMoveStart}
            on:moveEnd={handleMoveEnd}
          />
        {/each}
      </tr>
    {/each}
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
</style>
