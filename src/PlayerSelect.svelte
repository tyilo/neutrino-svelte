<script lang="ts">
  export let isHuman = true;
</script>

<label> <input type="radio" bind:group={isHuman} value={true} /> Human </label>
<label> <input type="radio" bind:group={isHuman} value={false} /> Bot </label>

<style>
  label {
    display: inline-block;
    margin: 1em;
  }
</style>
