<script lang="ts">
  import "./style.css";

  import PlayerSelect from "./PlayerSelect.svelte";
  import Board from "./Board.svelte";
  import { Client } from "boardgame.io/client";
  import { MCTSBot } from "boardgame.io/ai";
  import type { StateType } from "./game";
  import { Neutrino, StateWithPlayer } from "./game";
  import { tick } from "svelte";
  import { BotType } from "./bots";

  const client = Client({ game: Neutrino });
  (window as any).client = client;
  client.start();

  function addCloseButton() {
    const buttonText = "🗙";
    const debugPanel = document.querySelector(".debug-panel") as HTMLElement;
    const debugPanelNav = debugPanel.querySelector("nav") as HTMLElement;
    const firstNavButton = debugPanelNav.firstChild as HTMLElement;
    if (firstNavButton.textContent === buttonText) return;

    const closeNavButton = firstNavButton.cloneNode() as HTMLElement;
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

  type StateInfo = {
    id: string;
    index: number;
    optimal_move_id: string | null;
    optimal_winner: string | null;
  };

  async function fetchExternalInfo(state: StateType): Promise<StateInfo> {
    const s = new StateWithPlayer(state.G, state.ctx.currentPlayer);

    const url = new URL("https://api.neutrino.tyilo.com/info");
    url.searchParams.set("id", s.serialize());
    const res = await fetch(url);
    const data = await res.json();
    return data;
  }

  let valuation: string | null | undefined;
  client.subscribe(async (newState: StateType) => {
    valuation = undefined;
    const info = await fetchExternalInfo(newState);
    if (info.optimal_winner === null) {
      valuation = null;
    } else {
      valuation = info.optimal_winner.replace(/^./, (c) => c.toUpperCase());
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

  let botTypes: [BotType, BotType] = [BotType.Human, BotType.Human];
  $: isHuman = [
    botTypes[0] === BotType.Human,
    botTypes[1] === BotType.Human,
  ] as [boolean, boolean];

  let botToMove = false;
  let botMoving = false;
  let started = null;

  let botIterations = 2000;
  let botPlayoutDepth = 50;

  const localBot = new MCTSBot({
    game: client.game,
    enumerate: client.game.ai.enumerate,
    iterations: botIterations,
    playoutDepth: botPlayoutDepth,
    iterationCallback: botIterationCallback,
  });
  localBot.setOpt("async", true);

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

  async function getExternalMove() {
    const s = new StateWithPlayer(state.G, state.ctx.currentPlayer);
    const data = await fetchExternalInfo(state);

    if (data.optimal_move_id) {
      const newState = StateWithPlayer.deserialize(data.optimal_move_id);
      const move = s.getMoveToState(newState);
      if (move === null) {
        console.error("Got null move:", s, newState);
      } else {
        return {
          action: {
            type: "MAKE_MOVE",
            payload: {
              type: move.move,
              args: move.args,
            },
          },
        };
      }
    } else {
      console.error(data);
    }
  }

  function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function getBotMove() {
    const MIN_TIME = 1000;
    const startTime = Date.now();

    let botType = botTypes[currentPlayer];
    let move;
    if (botType === BotType.LocalBot) {
      move = await localBot.play(state, state.ctx.currentPlayer);
    } else if (botType === BotType.ExternalBot) {
      move = await getExternalMove();
    } else {
      console.error("Unknown bot type:", botType);
    }

    const endTime = Date.now();
    const diff = endTime - startTime;
    const delay = Math.max(0, MIN_TIME - diff);
    await timeout(delay);

    return move;
  }

  async function botMove() {
    const startStopCount = stopCount;
    botMoving = true;

    const result = await getBotMove();
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
    metadata; // ignore unused
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

  $: localBot.setOpt("iterations", botIterations);
  $: localBot.setOpt("playoutDepth", botPlayoutDepth);
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
  <div id="valuation">
    <details>
      <summary>Optimal valuation</summary>
      {#if valuation === undefined}
        ???
      {:else if valuation === null}
        Draw
      {:else}
        {valuation} will win with optimal play
      {/if}
    </details>
  </div>
  <fieldset disabled={botMoving || winner !== null}>
    <div class="player" class:currentPlayer={currentPlayer === 1}>
      <PlayerSelect bind:botType={botTypes[1]} />
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
      <PlayerSelect bind:botType={botTypes[0]} />
    </div>
    <div>
      Status:
      {#if winner !== null}
        <b>{winner === "0" ? "White" : "Black"} has won the game!</b>
      {:else if botToMove}{#if started}Waiting for bot...<br />
          <progress value={botProgress} />{:else}Stopped{/if}{:else}Waiting for
        human...{/if}
    </div>
    <h3>Local bot options</h3>
    <div class="botOptions">
      <label for="iterations">Iterations:</label>
      <input
        name="iterations"
        type="number"
        min="1"
        bind:value={botIterations}
      />
      <br />
      <label for="depth">Depth:</label>
      <input type="number" min="1" bind:value={botPlayoutDepth} />
    </div>
  </fieldset>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  #valuation {
    margin-top: 2em;
  }

  #valuation details {
    display: inline-block;
    border: 1px solid #aaa;
    border-radius: 4px;
    padding: 0.5em 0.5em 0;
  }

  #valuation summary {
    font-weight: bold;
    margin: -0.5em -0.5em 0;
    padding: 0.5em;
  }

  #valuation details[open] {
    padding: 0.5em;
  }

  #valuation details[open] summary {
    border-bottom: 1px solid #aaa;
    margin-bottom: 0.5em;
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

  .botOptions {
    margin: auto;
    margin-top: 1em;
    width: 200px;
    text-align: left;
  }

  .botOptions label {
    display: inline-block;
    width: 75px;
  }

  .botOptions input {
    width: 75px;
  }
</style>
