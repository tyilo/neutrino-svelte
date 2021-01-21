<script lang="ts">
  import interact from "interactjs";
  import { createEventDispatcher, onMount } from "svelte";
  import { PIECE } from "./game";

  export let position: [number, number];
  export let piece: PIECE;
  export let movable: boolean;
  export let validMoveSource: boolean;
  export let validMoveTarget: boolean;

  const dispatch = createEventDispatcher();

  function getPosition(element: HTMLElement): [number, number] {
    return ["x", "y"].map((k) =>
      parseInt(element.getAttribute(`data-${k}`))
    ) as [number, number];
  }

  let draggedOver = false;
  let draggable = null;
  onMount(() => {
    let dragX = 0;
    let dragY = 0;
    draggable = interact(pieceElement).draggable({
      origin: "parent",
      listeners: {
        move: (event) => {
          dispatch("moveStart", {
            from: getPosition(event.target.parentNode),
          });

          dragX += event.dx;
          dragY += event.dy;

          pieceElement.style.transform = `translate(${dragX}px, ${dragY}px)`;
        },
        end: (_event) => {
          dispatch("moveEnd");
          dragX = 0;
          dragY = 0;
          pieceElement.style.transform = null;
        },
      },
    });

    interact(cellElement).dropzone({
      ondrop: (event) => {
        dispatch("move", {
          from: getPosition(event.relatedTarget.parentNode),
          to: getPosition(event.target),
        });
        draggedOver = false;
      },
      ondragenter: (_event) => {
        draggedOver = true;
      },
      ondragleave: (_event) => {
        draggedOver = false;
      },
    });
  });

  let cellElement: HTMLTableDataCellElement;
  let pieceElement: HTMLDivElement;

  $: {
    if (draggable) {
      draggable.draggable(validMoveSource && movable);
    }
  }
</script>

<td
  bind:this={cellElement}
  class:validMoveSource
  class:validMoveTarget
  class:draggedOver
  data-x={position[0]}
  data-y={position[1]}
>
  <div
    bind:this={pieceElement}
    class:piece={piece !== PIECE.None}
    class:white={piece === PIECE.White}
    class:black={piece === PIECE.Black}
    class:neutrino={piece === PIECE.Neutrino}
  />
  <div class="moveTarget" />
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
    touch-action: none;
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

  .validMoveSource {
    background-color: lightgreen;
  }

  .validMoveTarget .moveTarget {
    width: 0;
    height: 0;
    border-radius: 100%;
    border: 10px #090 solid;
    margin: auto;
  }

  .validMoveTarget.draggedOver {
    background-color: lightgreen;
  }
</style>
