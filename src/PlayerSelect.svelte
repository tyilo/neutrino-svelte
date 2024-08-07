<script lang="ts">
  import { BotType } from "./bots";

  export let botType: BotType = BotType.Human;
</script>

<label>
  <input type="radio" bind:group={botType} value={BotType.Human} /> Human
</label>
<label>
  <input type="radio" bind:group={botType} value={BotType.LocalBot} /> Local Bot
</label>
<label>
  <input type="radio" bind:group={botType} value={BotType.ExternalBot} /> External
  Bot
</label>

<style>
  label {
    display: inline-block;
    margin: 1em;
  }
</style>
