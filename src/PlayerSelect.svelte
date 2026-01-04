<script lang="ts">
import { BotType } from "./bots";

interface Props {
	botType: BotType;
}

let { botType = $bindable() }: Props = $props();
</script>

<label>
  <input type="radio" bind:group={botType} value={BotType.Human} /> Human
</label>
<label>
  <input type="radio" bind:group={botType} value={BotType.OptimalBot} /> Bot (Optimal)
</label>

<style>
  label {
    display: inline-block;
    margin: 1em;
  }
</style>
