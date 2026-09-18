<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>{{ getShowText('callsign') }}</th>
          <th>{{ getShowText('communicationCount') }}</th>
          <th>{{ getShowText('lastCommunicationAt') }}</th>
          <th>{{ getShowText('firstCommunicationAt') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ record.callsign }}</td>
          <td>{{ record.communicationCount }}</td>
          <td>{{ record.lastCommunicationAt ?? '—' }}</td>
          <td>{{ record.firstCommunicationAt ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { CallsignDetail } from '@schema/communicationLog';
import getShowText from '@/scripts/showText';

defineProps<{
  record: CallsignDetail['basic'];
}>();
</script>

<style scoped lang="scss">
.table-wrapper {
  overflow-x: auto;
}
</style>
