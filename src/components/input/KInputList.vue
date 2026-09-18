<template>
  <div class="input-list">
    <ul>
      <li v-for="(item, index) in modelValue" :key="index">
        {{ item }}<button @click="modelValue.splice(index, 1)" type="button">✖</button>
      </li>
    </ul>
    <input type="text" v-model="inputValue" @keydown="handleKeydown" />
  </div>
</template>
<script setup lang="ts">
const modelValue = defineModel<string[]>({
  default: () => [],
});
const inputValue = ref<string>('');
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (inputValue.value !== '') {
      modelValue.value.push(inputValue.value.trim());
      inputValue.value = '';
    }
  }
  if (event.key === 'Backspace' && inputValue.value === '') {
    modelValue.value.pop();
  }
}
</script>
<style scoped lang="scss">
.input-list {
  padding: 0.5em;
  ul {
    display: flex;
    column-gap: 0.5em;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
    li {
      list-style: none;
      padding: 0 0.5em;
      margin: 0;
      border: 1px solid;
      border-radius: 0.2em;
      @include theme.use {
        border-color: theme.mix('color', 'background', 50%);
      }
      button {
        padding: 0;
        margin: 0;
        margin-left: 0.5em;
        border: none;
        color: red;
        cursor: pointer;
        background-color: transparent;
      }
    }
  }
  input {
    margin-top: 0.5em;
    outline: none;
    font-size: 1em;
  }
}
</style>
