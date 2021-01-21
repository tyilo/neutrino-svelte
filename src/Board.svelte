<script lang="ts">
  import type { Client } from "boardgame.io/client";
  import type { Grid, StateType } from "./game";
  import { getPieceToMove, getValidMovesFrom } from "./game";
  import Cell from "./Cell.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let client: ReturnType<typeof Client>;
  export let isHuman: [boolean, boolean];
  export let currentPlayer: number = null;
  export let state: StateType = null;
  export let winner: string = null;

  let pieceToMove = null;
  client.subscribe((newState: StateType) => {
    state = newState;
    currentPlayer = parseInt(state.ctx.currentPlayer);
    pieceToMove = getPieceToMove(state.G, state.ctx.currentPlayer);
    if (state.ctx.gameover) {
      winner = state.ctx.gameover.winner;
    } else {
      winner = null;
    }
  });

  function canMoveFrom(cells: Grid, [x, y]: [number, number]): boolean {
    return winner === null && pieceToMove === cells[y][x];
  }

  function canMoveTo(
    validMoveTargets: [number, number][],
    [x, y]: [number, number]
  ): boolean {
    return validMoveTargets.some((p) => p[0] === x && p[1] === y);
  }

  function handleMove(e: CustomEvent) {
    if (canMoveTo(validMoveTargets, e.detail.to)) {
      client.moves.move(e.detail.from, e.detail.to);
      dispatch("move");
    }
  }

  let validMoveTargets = [];
  function handleMoveStart(e: CustomEvent) {
    validMoveTargets = getValidMovesFrom(state.G.cells, e.detail.from);
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
            piece={state.G.cells[y][x]}
            validMoveSource={canMoveFrom(state.G.cells, [x, y])}
            movable={isHuman[currentPlayer]}
            validMoveTarget={canMoveTo(validMoveTargets, [x, y])}
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
