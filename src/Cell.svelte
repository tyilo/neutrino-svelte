<script lang="ts">
  import interact from "interactjs";
  import { onMount } from "svelte";
  import { Piece, type Position } from "./game";
  import { Valuation } from "./valuation";
  import type { Interactable } from "@interactjs/core/Interactable";

  interface Props {
    position: Position;
    piece: Piece;
    movable: boolean;
    validMoveSource: boolean;
    validMoveTarget: boolean;
    targetValuation: Promise<Valuation | undefined>;
    moveStart: (from: Position) => void;
    moveEnd: () => void;
    move: (from: Position, to: Position) => void;
  }

  let {
    position,
    piece,
    movable,
    validMoveSource,
    validMoveTarget,
    targetValuation,
    moveStart,
    moveEnd,
    move,
  }: Props = $props();

  function getPosition(element: HTMLElement): Position {
    return ["x", "y"].map((k) =>
      parseInt(element.getAttribute(`data-${k}`)!),
    ) as [number, number];
  }

  let draggedOver = $state(false);
  let draggable: Interactable | undefined = $state();
  onMount(() => {
    let dragX = 0;
    let dragY = 0;
    draggable = interact(pieceElement).draggable({
      origin: "parent",
      listeners: {
        move: (event) => {
          moveStart(getPosition(event.target.parentNode));

          dragX += event.dx;
          dragY += event.dy;

          pieceElement.style.transform = `translate(${dragX}px, ${dragY}px)`;
        },
        end: (_event) => {
          moveEnd();
          dragX = 0;
          dragY = 0;
          pieceElement.style.transform = "";
        },
      },
    });

    interact(cellElement).dropzone({
      ondrop: (event) => {
        move(
          getPosition(event.relatedTarget.parentNode),
          getPosition(event.target),
        );
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

  let cellElement: HTMLTableCellElement;
  let pieceElement: HTMLDivElement;

  $effect(() => {
    if (draggable !== undefined) {
      draggable.draggable(validMoveSource && movable);
    }
  });

  async function getTargetClass(
    targetValuation: Promise<Valuation | undefined>,
  ): Promise<string> {
    const valuation = await targetValuation;
    switch (valuation) {
      case undefined:
        return "no-valuation";
      case Valuation.Loss:
        return "loss-valuation";
      case Valuation.Neutral:
        return "neutral-valuation";
      case Valuation.Win:
        return "win-valuation";
    }
  }

  let targetClass: string = $state("no-valuation");

  async function updateTargetClass(
    targetValuation: Promise<Valuation | undefined>,
  ): Promise<void> {
    targetClass = await getTargetClass(targetValuation);
  }

  $effect(() => {
    updateTargetClass(targetValuation);
  });
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
    class:piece={piece !== Piece.None}
    class:white={piece === Piece.White}
    class:black={piece === Piece.Black}
    class:neutrino={piece === Piece.Neutrino}
  />
  <div class="moveTarget {targetClass}" data-foo={targetClass} />
</td>

<style>
  td {
    width: min(15vmin, 100px);
    height: min(15vmin, 100px);
    border: 1px black solid;
  }

  .piece {
    width: 50%;
    height: 50%;
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

  .neutrino::after {
    content: "ν";
    font-size: 2em;
    color: white;
  }

  .validMoveSource {
    background-color: lightgreen;
  }

  .validMoveTarget .moveTarget {
    width: 0;
    height: 0;
    border-radius: 100%;
    border-width: 10px;
    border-style: solid;
    margin: auto;
  }

  .no-valuation {
    border-color: #999;
  }

  .neutral-valuation {
    border-color: #00b;
  }

  .loss-valuation {
    border-color: #b00;
  }

  .win-valuation {
    border-color: #0b0;
  }

  .validMoveTarget.draggedOver {
    background-color: lightgreen;
  }
</style>
