<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Move, Position, State } from "./game";

  const dispatch = createEventDispatcher();

  export let history: State[];
  export let historyIndex: number;

  function positionString(position: Position): string {
    return String.fromCharCode("a".charCodeAt(0) + position[0]) + position[1];
  }

  function moveString(from: State, to: State): string {
    const move = from.moveTo(to);
    if (!from.movedNeutrino) {
      return positionString(move[1]);
    }

    return positionString(move[0]) + positionString(move[1]);
  }

  let moveRows: [number, State, State][][];
  $: {
    moveRows = [];
    for (let i = 0; i < history.length - 1; i++) {
      const rowIndex = Math.floor(i / 4);
      if (rowIndex >= moveRows.length) {
        moveRows.push([]);
      }
      moveRows[rowIndex].push([i, history[i], history[i + 1]]);
    }
  }

  function goto(index: number): void {
    dispatch("goto", index + 1);
  }
</script>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>ν</th>
      <th>P</th>
      <th>ν</th>
      <th>P</th>
    </tr>
  </thead>
  <tbody>
    {#each moveRows as moveRow, i}
      <tr>
        <td>{i + 1}.</td>
        {#each moveRow as move}
          <td
            class:selected={move[0] === historyIndex - 1}
            on:click={() => goto(move[0])}>{moveString(move[1], move[2])}</td
          >
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  table {
    border: 1px solid black;
    border-collapse: collapse;
    min-width: 200px;
  }

  td,
  th {
    border: 1px solid black;
    width: 50px;
  }

  td {
    cursor: pointer;
  }

  .selected {
    background-color: lightblue;
  }
</style>
