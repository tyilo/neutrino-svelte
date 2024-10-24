<script lang="ts">
  import type { State, Player, Position } from "./game";
  import { Valuation, getValuationForMove } from "./valuation";
  import Cell from "./Cell.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  interface Props {
    isHuman: [boolean, boolean];
    gameState: State;
    showValuations: boolean;
  }

  let { isHuman, gameState = $bindable(), showValuations }: Props = $props();

  let winner: Player | undefined = $derived(gameState.getWinner());

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

  function emptyMoveTo(): boolean[][] {
    return Array(5)
      .fill(undefined)
      .map(() => Array(5).fill(false));
  }

  function emptyTargetValuation(): Promise<Valuation | undefined>[][] {
    return Array(5)
      .fill(undefined)
      .map(() => Array(5).fill(Promise.resolve(undefined)));
  }

  let canMoveTo: boolean[][] = $state(emptyMoveTo());
  let targetValuations: Promise<Valuation | undefined>[][] = $state(
    emptyTargetValuation()
  );
  function resetCanMoveTo() {
    canMoveTo = emptyMoveTo();
    targetValuations = emptyTargetValuation();
  }

  function handleMoveStart(e: CustomEvent) {
    resetCanMoveTo();
    for (let [x, y] of gameState.getValidMovesFrom(e.detail.from)) {
      canMoveTo[y][x] = true;
      targetValuations[y][x] = getTargetValuation(
        gameState.move([e.detail.from, [x, y]])
      );
    }
  }

  function handleMove(e: CustomEvent) {
    if (canMoveTo[e.detail.to[1]][e.detail.to[0]]) {
      gameState = gameState.move([e.detail.from, e.detail.to]);
      dispatch("move");
    }
  }

  function handleMoveEnd() {
    resetCanMoveTo();
  }

  const fives = [0, 1, 2, 3, 4];
</script>

{#if gameState}
  <table>
    <tbody>
      {#each fives as y}
        <tr>
          <th>{5 - y}</th>
          {#each fives as x}
            <Cell
              piece={gameState.cells[y][x]}
              validMoveSource={canMoveFrom(gameState, [x, y])}
              movable={isHuman[gameState.currentPlayer]}
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
    </tbody>
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
