<script lang="ts">
  import PlayerSelect from "./PlayerSelect.svelte";
  import Board from "./Board.svelte";
  import { Client } from "boardgame.io/client";
  import { MCTSBot } from "boardgame.io/ai";
  import type { StateType } from "./game";
  import { Neutrino } from "./game";
  import { tick } from "svelte";

  const client = Client({ game: Neutrino });
  window.client = client;
  client.start();

  function addCloseButton() {
    const buttonText = "🗙";
    const debugPanel = document.querySelector(".debug-panel") as HTMLElement;
    const debugPanelNav = debugPanel.querySelector("nav") as HTMLElement;
    const firstNavButton = debugPanelNav.firstChild as HTMLElement;
    if (firstNavButton.textContent === buttonText) return;

    const closeNavButton = firstNavButton.cloneNode();
    closeNavButton.classList.remove("active");
    closeNavButton.textContent = "🗙";
    closeNavButton.addEventListener("click", toggleDebugToolbar);
    debugPanelNav.insertBefore(closeNavButton, firstNavButton);
  }

  window.addEventListener("keypress", async (event) => {
    if (event.key === ".") {
      await tick();
      addCloseButton();
    }
  });

  async function toggleDebugToolbar() {
    const event = new KeyboardEvent("keypress", { key: "." });
    window.dispatchEvent(event);
  }

  toggleDebugToolbar();

  let state: StateType;
  let winner: string;
  let currentPlayer: number;

  let isHuman: [boolean, boolean] = [true, false];

  let botToMove = false;
  let botMoving = false;
  let started = null;

  const bot = new MCTSBot({
    game: client.game,
    enumerate: client.game.ai.enumerate,
    iterations: 2000,
    playoutDepth: 50,
    iterationCallback: botIterationCallback,
  });
  bot.setOpt("async", true);

  let stopCount = 0;
  function toggleStart() {
    started = !started;
    if (!started) {
      stopCount++;
      botMoving = false;
    }
  }

  function reset() {
    stopCount++;
    botMoving = false;
    started = null;
    client.reset();
  }

  async function botMove() {
    let startStopCount = stopCount;
    botMoving = true;

    const result = await bot.play(state, state.ctx.currentPlayer);
    botMoving = false;

    if (stopCount !== startStopCount) {
      return;
    }

    const action = result.action;
    if (!action) {
      return;
    }

    if (action.type === "MAKE_MOVE") {
      client.moves[action.payload.type].apply(null, action.payload.args);
    } else {
      console.error("Got unknown action:", action);
    }
  }

  let botProgress = 0;
  function botIterationCallback({ iterationCounter, numIterations, metadata }) {
    botProgress = iterationCounter / numIterations;
  }

  function handleMove() {
    if (!started) {
      started = true;
    }
  }

  $: botToMove = !isHuman[currentPlayer];

  $: {
    if (started && !botMoving && botToMove) {
      botMove();
    }
  }
</script>

<main>
  <div>
    <button type="button" on:click={reset}>Reset</button>
    <button type="button" on:click={toggleDebugToolbar}
      >Toggle debug toolbar</button
    >
    <br />
    <button type="button" on:click={toggleStart}
      >{#if started}Stop{:else}Start{/if}</button
    >
  </div>
  <fieldset disabled={botMoving || winner !== null}>
    <div class="player" class:currentPlayer={currentPlayer === 1}>
      <PlayerSelect bind:isHuman={isHuman[1]} />
    </div>
    <Board
      {client}
      {isHuman}
      bind:currentPlayer
      bind:state
      bind:winner
      on:move={handleMove}
    />
    <div class="player" class:currentPlayer={currentPlayer === 0}>
      <PlayerSelect bind:isHuman={isHuman[0]} />
    </div>
    <div>
      Status:
      {#if winner !== null}
        <b>{winner === "0" ? "White" : "Black"} has won the game!</b>
      {:else if botToMove}{#if started}Waiting for bot...<br />
          <progress value={botProgress} />{:else}Stopped{/if}{:else}Waiting for
        human...{/if}
    </div>
  </fieldset>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  fieldset {
    border: none;
  }

  .player {
    display: inline-block;
    margin: 1em;
    border: 2px solid rgba(0, 0, 0, 0);
    border-radius: 10px;
  }

  .currentPlayer {
    border-color: green;
  }
</style>
