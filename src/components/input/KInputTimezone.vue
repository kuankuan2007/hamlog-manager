<template>
  <select v-model.number="timezoneResult" aria-label="时区">
    <option v-for="timezone in timezones" :key="timezone" :value="timezone">
      {{ formatTimezone(timezone) }}
    </option>
  </select>
</template>
<script setup lang="ts">
const timezoneResult = defineModel<number>('modelValue', { default: 0 });

const timezones = Array.from({ length: 27 }, (_, index) => index - 12);

function formatTimezone(timezone: number): string {
  if (timezone === 0) return 'UTC';
  return `UTC${timezone > 0 ? '+' : ''}${timezone}`;
}
</script>
