<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-if="showCallsign">{{ getShowText('callsign') }}</th>
          <th>{{ resolvedTimeLabel }}</th>
          <th>{{ getShowText('frequency') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(record, index) in records"
          :key="`${record.callsign}-${getTimeValue(record)}-${record.frequency}-${index}`"
        >
          <td v-if="showCallsign">
            <slot name="callsign" :record="record">{{ record.callsign }}</slot>
          </td>
          <td>{{ getTimeValue(record) }}</td>
          <td>{{ record.frequency }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { CommunicationLogBasic, CommunicationLogSearchBasic } from '@schema/communicationLog';
import getShowText from '@/scripts/showText';

type CommunicationLogBasicRow = CommunicationLogBasic | CommunicationLogSearchBasic;

const props = withDefaults(
  defineProps<{
    records: CommunicationLogBasicRow[];
    showCallsign?: boolean;
    timeField?: 'date' | 'time';
    timeLabel?: string;
  }>(),
  {
    showCallsign: true,
    timeField: 'date',
    timeLabel: '',
  }
);

const { records, showCallsign, timeField, timeLabel } = toRefs(props);

function getTimeValue(record: CommunicationLogBasicRow): string {
  return timeField.value === 'time'
    ? 'time' in record
      ? record.time
      : record.date
    : 'date' in record
      ? record.date
      : record.time;
}

const resolvedTimeLabel = computed(() => timeLabel.value || getShowText(timeField.value));
</script>

<style scoped lang="scss">
.table-wrapper {
  overflow-x: auto;
}
</style>
