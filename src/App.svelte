<script lang="ts">
import "./style.css";

import Board from "./Board.svelte";
import { BotType } from "./bots";
import { decodeStateList, encodeStateList } from "./encoding";
import { Player, State } from "./game";
import History from "./History.svelte";
import PlayerSelect from "./PlayerSelect.svelte";
import { getExternalInfo } from "./valuation";

let gameState = $state(new State());
let history = $state([new State()]);
let historyIndex = $state(0);
const winner: Player | undefined = $derived(gameState.getWinner());

let botTypes: [BotType, BotType] = $state([BotType.Human, BotType.Human]);
const isHuman = $derived([
	botTypes[0] === BotType.Human,
	botTypes[1] === BotType.Human,
] as [boolean, boolean]);

const botToMove = $derived(!isHuman[gameState.currentPlayer]);
let botMoving = $state(false);
let started = $state(false);

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
	gameState = new State();
	history = [gameState];
	historyIndex = 0;
	handleNewState();
}

async function getExternalNextState(): Promise<State> {
	const data = await getExternalInfo(gameState);

	if (data.optimal_move_id) {
		return State.deserializeString(data.optimal_move_id);
	} else {
		throw new Error(`No optimal move found.`);
	}
}

let showValuations = $state(false);

function timeout(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let minBotTime: number = $state(1000);
async function getBotNextState(): Promise<State> {
	const startTime = Date.now();

	const botType = botTypes[gameState.currentPlayer];
	let nextState: State;
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

	gameState = nextState;
	handleMove();
}

let valuation: string | null | undefined = $state();
async function updateValuation(): Promise<void> {
	valuation = undefined;
	const info = await getExternalInfo(gameState);
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
	history = [...history, gameState];
	handleNewState();
}

function handleHumanMove(): void {
	started = true;
	handleMove();
}

function undo() {
	gotoHistory(historyIndex - 1);
}

function redo() {
	gotoHistory(historyIndex + 1);
}

function gotoHistory(newIndex: number): void {
	started = false;
	historyIndex = newIndex;
	gameState = history[historyIndex];
	handleNewState();
}

let initialized = false;

$effect(() => {
	if (!initialized) {
		try {
			history = [
				...history,
				...decodeStateList(window.location.hash.substring(1)),
			];
			historyIndex = history.length - 1;
			gameState = history[historyIndex];
		} catch (e) {
			console.error(e);
		}
		initialized = true;
	}
	let url = "/";
	if (history.length > 1) {
		url += `#${encodeStateList(history.slice(1))}`;
	}
	window.history.replaceState(undefined, "", url);
});

$effect(() => {
	if (started && !botMoving && botToMove && winner === undefined) {
		botMove();
	}
});
</script>

<main>
  <div id="center">
    <fieldset disabled={botMoving || winner !== undefined}>
      <div
        class="player"
        class:currentPlayer={gameState.currentPlayer === Player.Black}
      >
        <PlayerSelect bind:botType={botTypes[1]} />
      </div>
      <Board
        {isHuman}
        {showValuations}
        bind:gameState
        move={handleHumanMove}
      />
      <div
        class="player"
        class:currentPlayer={gameState.currentPlayer === Player.White}
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
      <button type="button" onclick={reset}>Reset</button>
      <br />
      <button type="button" onclick={toggleStart}
        >{#if started}Stop{:else}Start{/if}</button
      >
      <br />
      <button type="button" onclick={undo} disabled={historyIndex === 0}
        >Undo</button
      >
      <button
        type="button"
        onclick={redo}
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
      <details bind:open={showValuations}>
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
    <History {history} {historyIndex} goto={gotoHistory} />
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

  @media only screen and (max-width: 1200px) {
    main {
      grid-template:
        "center sidebar" 1fr
        / 1fr 300px;
    }
  }

  @media only screen and (max-width: 900px) {
    main {
      grid-template:
        "center" 1fr
        "sidebar" 1fr
        / 1fr;
    }
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
