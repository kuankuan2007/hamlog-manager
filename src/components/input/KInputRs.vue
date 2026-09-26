<template>
  <input v-model.number.lazy="inputValue" type="number" />
</template>
<script setup lang="ts">
const modelValue = defineModel<number>('modelValue', { default: 59 });
const inputValue = computed({
  get: () => modelValue.value,
  set: (value: number) => {
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
