<template>
  时间：<input v-url-hash-focus="props.id" type="datetime-local" v-model="htmlInputValue" /> 时区：
  <k-input-timezone-raw v-model="timezone" :id="props.timezoneId" />
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
  getCurrentTimeTagString,
} from '@util/time';
import KInputTimezoneRaw from './KInputTimezone.vue';
import { vUrlHashFocus } from '@/scripts/urlHashFocus';

const props = defineProps<{ id?: string; timezoneId?: string }>();
const modelValue = defineModel<string>('modelValue', { default: () => getCurrentTimeTagString() });

const timezone = defineModel<number>('timezone', { default: getLocalTimeZoneOffsetHours });
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
