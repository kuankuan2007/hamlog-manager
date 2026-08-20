<template>
  <select name="mode" v-model="inputValue">
    <option value="FM">FM</option>
    <option value="AM">AM</option>
    <option value="CW">CW</option>
  </select>
</template>
<script setup lang="ts">
import type { RadioMode } from '@/types/data';
const modelValue = defineModel<RadioMode>('modelValue', { default: () => 'FM' });
const inputValue = computed({
  get: () => modelValue.value,
  set: (value: RadioMode) => {
    modelValue.value = value;
  },
});
</script>
<style scoped lang="scss">

</style>
