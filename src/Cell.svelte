<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { PIECE } from "./game";

  export let piece: PIECE;
  export let selected: boolean;
  export let movable: boolean;

  const dispatch = createEventDispatcher();
</script>

<td on:click={() => dispatch("click")} class:selected class:movable>
  <div
    class:piece={piece !== PIECE.None}
    class:white={piece === PIECE.White}
    class:black={piece === PIECE.Black}
    class:neutrino={piece === PIECE.Neutrino}
  />
</td>

<style>
  td {
    width: 100px;
    height: 100px;
    font-size: 2em;
    border: 1px black solid;
  }

  .piece {
    width: 50px;
    height: 50px;
    border-radius: 100%;
    border: 2px #777 solid;
    margin: auto;
  }

  .white {
    background-color: white;
  }

  .black {
    background-color: black;
  }

  .neutrino {
    background-color: #777;
  }

  .movable {
    background-color: lightgreen;
  }

  .selected {
    background-color: #0c0;
  }
</style>
