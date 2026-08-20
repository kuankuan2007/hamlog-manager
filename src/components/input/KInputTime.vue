<template>
  时间：<input type="datetime-local" v-model="htmlInputValue" /> 时区：<k-input-timezone-raw
    v-model="timezone"
  />
  <br />
  <div>UTC: {{ modelValue }}</div>
</template>
<script setup lang="ts">
import {
  Temporal,
  timeTagStringToPlainDateTime,
  plainDateTimeToTimeTagString,
  getLocalTimeZoneOffsetHours,
  datetimeLocalValueToPlainDateTime,
  plainDateTimeToDatetimeLocalValue,
  getCurrentTimeTagString
} from '@/scripts/time';
import KInputTimezoneRaw from './KInputTimezone.vue';

const modelValue = defineModel<string>('modelValue', { default: () => getCurrentTimeTagString() });


const timezone = ref(getLocalTimeZoneOffsetHours());
const timeObject = computed({
  get: () => timeTagStringToPlainDateTime(modelValue.value),
  set: (value: Temporal.PlainDateTime) => {
    modelValue.value = plainDateTimeToTimeTagString(value);
  },
});
const htmlInputValue = computed({
  get: () => plainDateTimeToDatetimeLocalValue(timeObject.value, timezone.value),
  set: (value: string) => {
    timeObject.value = datetimeLocalValueToPlainDateTime(value, timezone.value);
  },
});
</script>
