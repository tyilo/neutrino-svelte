<script lang="ts">
  import type { State, Ctx, LogEntry } from "boardgame.io";
  import { Client } from "boardgame.io/client";
  import type { Grid } from "./game";
  import { Neutrino, getPieceToMove, getValidMovesFrom } from "./game";
  import Cell from "./Cell.svelte";

  const client = Client({ game: Neutrino });
  client.start();

  let state: State<any, Ctx> & {
    isActive: boolean;
    isConnected: boolean;
    log: LogEntry[];
  };

  let pieceToMove = null;
  let winner = null;
  client.subscribe((newState) => {
    state = newState;
    pieceToMove = getPieceToMove(state.G, state.ctx.currentPlayer);
    if (state.ctx.gameover) {
      winner = state.ctx.gameover.winner;
    } else {
      winner = null;
    }
  });

  function canMoveFrom(cells: Grid, [x, y]: [number, number]) {
    return winner === null && pieceToMove === cells[y][x];
  }

  function handleMove(e: CustomEvent) {
    client.moves.move(e.detail.from, e.detail.to);
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

<main>
  {#if state}
    <table>
      {#each fives as y}
        <tr>
          {#each fives as x}
            <Cell
              piece={state.G.cells[y][x]}
              movable={canMoveFrom(state.G.cells, [x, y])}
              validMoveTarget={validMoveTargets.some(
                (p) => p[0] === x && p[1] === y
              )}
              position={[x, y]}
              on:move={handleMove}
              on:moveStart={handleMoveStart}
              on:moveEnd={handleMoveEnd}
            />
          {/each}
        </tr>
      {/each}
    </table>
    {#if winner}
      <div>Winner: {winner}</div>
    {/if}
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

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
