<template>
  <input v-model="inputValue" type="number"/>
</template>
<script setup lang="ts">
const modelValue = defineModel<number>('modelValue', { default: 59 });
const inputValue = computed({
  get: () => modelValue.value,
  set: (value: number) => {
    if (typeof value !== 'number') {
      try {
        value = Number(value);
      } catch {
        value = 59;
      }
    }
    if (Number.isInteger(value) === false) {
      value = Math.round(value);
    }
    if (value < 11) {
      modelValue.value = 11;
    } else if (value > 99) {
      modelValue.value = 99;
    } else {
      modelValue.value = value;
    }
  },
});
</script>
<style scoped lang="scss"></style>
