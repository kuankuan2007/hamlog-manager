<template>
  <select name="mode" v-model="inputValue">
    <option value="FM">FM</option>
    <option value="AM">AM</option>
    <option value="CW">CW</option>
  </select>
</template>
<script setup lang="ts">
import type { RadioMode } from '@/types/data';
import { defaultValue } from '@/config';

const modelValue = defineModel<RadioMode>('modelValue', { default: () => defaultValue.newLog.mode });
const inputValue = computed({
  get: () => modelValue.value,
  set: (value: RadioMode) => {
    modelValue.value = value;
  },
});
</script>
<style scoped lang="scss"></style>
