<template><input type="number" v-model="inputValue" step="0.001" /> MHZ</template>
<script setup lang="ts">
const modelValue = defineModel<number>('modelValue', { default: 145.67 });
const inputValue = computed({
  get: () => modelValue.value,
  set: (value: number) => {
    if (typeof value !== 'number') {
      try {
        value = Number(value);
      } catch {
        value = 145.67;
      }
    }
    modelValue.value = value;
  },
});
</script>
<style scoped lang="scss"></style>
