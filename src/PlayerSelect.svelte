<script lang="ts">
  export let isHuman = true;

  // We can't bind a boolean to the inputs' value
  $: _isHuman = Number(isHuman);

  function handleChange() {
    isHuman = Boolean(_isHuman);
  }
</script>

<label>
  <input
    type="radio"
    bind:group={_isHuman}
    value={1}
    on:change={handleChange}
  /> Human
</label>
<label>
  <input
    type="radio"
    bind:group={_isHuman}
    value={0}
    on:change={handleChange}
  /> Bot
</label>

<style>
  label {
    display: inline-block;
    margin: 1em;
  }
</style>
