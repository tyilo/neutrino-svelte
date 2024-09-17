<script lang="ts">
  import "./style.css";

  import PlayerSelect from "./PlayerSelect.svelte";
  import Board from "./Board.svelte";
  import { Player, State } from "./game";
  import { BotType } from "./bots";
  import History from "./History.svelte";

  type StateInfo = {
    id: string;
    index: number;
    optimal_move_id: string | null;
    optimal_winner: string | null;
  };

  async function fetchExternalInfo(state: State): Promise<StateInfo> {
    const url = new URL("https://api.neutrino.tyilo.com/info");
    url.searchParams.set("id", state.serialize());
    const res = await fetch(url);
    const data = await res.json();
    return data;
  }

  let state = new State();
  let history = [state];
  let historyIndex = 0;
  let winner: Player | undefined;
  $: winner = state.getWinner();

  $: (window as any).state = state;

  let botTypes: [BotType, BotType] = [BotType.Human, BotType.Human];
  $: isHuman = [
    botTypes[0] === BotType.Human,
    botTypes[1] === BotType.Human,
  ] as [boolean, boolean];

  let botToMove = false;
  let botMoving = false;
  let started = false;

  let stopCount = 0;
  function toggleStart(): void {
    started = !started;
    if (!started) {
      stopCount++;
      botMoving = false;
    }
  }

  function reset(): void {
    stopCount++;
    botMoving = false;
    started = false;
    winner = undefined;
    state = new State();
    history = [state];
    historyIndex = 0;
  }

  async function getExternalNextState(): Promise<State> {
    const data = await fetchExternalInfo(state);

    if (data.optimal_move_id) {
      return State.deserialize(data.optimal_move_id);
    } else {
      throw new Error(`No optimal move found.`);
    }
  }

  function timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let minBotTime: number = 1000;
  async function getBotNextState(): Promise<State> {
    const startTime = Date.now();

    let botType = botTypes[state.currentPlayer];
    let nextState;
    if (botType === BotType.ExternalBot) {
      nextState = await getExternalNextState();
    } else {
      throw new Error(`Unknown bot type: ${botType}`);
    }

    const endTime = Date.now();
    const diff = endTime - startTime;
    const delay = Math.max(0, minBotTime - diff);
    await timeout(delay);

    return nextState;
  }

  async function botMove(): Promise<void> {
    const startStopCount = stopCount;
    botMoving = true;

    const nextState = await getBotNextState();
    botMoving = false;

    if (stopCount !== startStopCount) {
      return;
    }

    state = nextState;
    handleMove();
  }

  let valuation: string | null | undefined;
  async function updateValuation(): Promise<void> {
    valuation = undefined;
    const info = await fetchExternalInfo(state);
    if (info.optimal_winner === null) {
      valuation = null;
    } else {
      valuation = info.optimal_winner.replace(/^./, (c) => c.toUpperCase());
    }
  }
  updateValuation();

  function handleNewState(): void {
    updateValuation();
  }

  function handleMove(): void {
    historyIndex++;
    history = history.slice(0, historyIndex);
    history = [...history, state];
    handleNewState();
  }

  function handleHumanMove(): void {
    if (!started) {
      started = true;
    }
    handleMove();
  }

  function undo() {
    gotoHistory(historyIndex - 1);
  }

  function redo() {
    gotoHistory(historyIndex + 1);
  }

  function gotoHistory(newIndex: number): void {
    console.log(newIndex, history.length);
    historyIndex = newIndex;
    state = history[historyIndex];
    handleNewState();
  }

  function handleGotoHistory(e: CustomEvent): void {
    gotoHistory(e.detail);
  }

  $: botToMove = !isHuman[state.currentPlayer];

  $: {
    if (started && !botMoving && botToMove && winner === undefined) {
      botMove();
    }
  }
</script>

<main>
  <div id="center">
    <fieldset disabled={botMoving || winner !== undefined}>
      <div
        class="player"
        class:currentPlayer={state.currentPlayer === Player.Black}
      >
        <PlayerSelect bind:botType={botTypes[1]} />
      </div>
      <Board {isHuman} bind:state on:move={handleHumanMove} />
      <div
        class="player"
        class:currentPlayer={state.currentPlayer === Player.White}
      >
        <PlayerSelect bind:botType={botTypes[0]} />
      </div>
      <div>
        Status:
        {#if winner !== undefined}
          <b>{winner === Player.White ? "White" : "Black"} has won the game!</b>
        {:else if botToMove}
          {#if started}
            Waiting for bot...
          {:else}
            Stopped
          {/if}
        {:else}
          Waiting for human...
        {/if}
      </div>
    </fieldset>
  </div>
  <div id="sidebar">
    <div>
      <button type="button" on:click={reset}>Reset</button>
      <br />
      <button type="button" on:click={toggleStart}
        >{#if started}Stop{:else}Start{/if}</button
      >
      <br />
      <button type="button" on:click={undo} disabled={historyIndex === 0}
        >Undo</button
      >
      <button
        type="button"
        on:click={redo}
        disabled={historyIndex === history.length - 1}>Redo</button
      >
    </div>
    <label
      >Min bot time: <input
        id="bot-delay"
        type="range"
        min="0"
        max="5000"
        bind:value={minBotTime}
      /></label
    >
    <div id="valuation">
      <details>
        <summary>Optimal valuation</summary>
        {#if valuation === undefined}
          ???
        {:else if valuation === null}
          Draw
        {:else}
          <b>{valuation}</b> will win with optimal play
        {/if}
      </details>
    </div>
    <br />
    <br />
    <History {history} {historyIndex} on:goto={handleGotoHistory} />
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
    display: grid;
    grid-template:
      "none center sidebar" 1fr
      / 300px 1fr 300px;
  }

  #center {
    grid-area: center;
  }

  #sidebar {
    grid-area: sidebar;
  }

  #bot-delay {
    width: 250px;
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
</style>
