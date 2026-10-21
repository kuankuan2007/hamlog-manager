<template><input type="number" v-model="inputValue" step="0.001" /> MHZ</template>
<script setup lang="ts">
import { defaultValue } from '@/config';

const modelValue = defineModel<number>('modelValue', { default: defaultValue.newLog.frequency });
const inputValue = computed({
  get: () => modelValue.value,
  set: (value: number) => {
    if (typeof value !== 'number') {
      try {
        value = Number(value);
      } catch {
        value = defaultValue.newLog.frequency;
      }
    }
    modelValue.value = value;
  },
});
</script>
<style scoped lang="scss"></style>
