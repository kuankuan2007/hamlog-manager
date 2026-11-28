<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>{{ getShowText('callsign') }}</th>
          <th>{{ getShowText('postalCode') }}</th>
          <th>{{ getShowText('address') }}</th>
          <th>{{ getShowText('recipientName') }}</th>
          <th>{{ getShowText('updatedAt') }}</th>
          <th>{{ getShowText('updatedBy') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="record in records"
          :key="record.callsign + record.updatedBy"
          v-url-hash-active="`address-id-${encodeURIComponent(record.updatedBy)}`"
        >
          <td>{{ record.callsign }}</td>
          <td>{{ record.postalCode }}</td>
          <td>{{ record.address }}</td>
          <td>{{ record.recipientName ?? '—' }}</td>
          <td>{{ record.updatedAt }}</td>
          <td>{{ formatUpdatedBy(record.updatedBy) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Address } from '@schema/address';
import getShowText from '@/scripts/showText';
import { formatUpdatedBy } from '@/scripts/selfInfo';
import { vUrlHashActive } from '@/scripts/urlHashActive';

defineProps<{
  records: Address[];
}>();
</script>

<style scoped lang="scss">
@use '@/styles/theme.scss' as *;

.table-wrapper {
  overflow-x: auto;
}

tr.url-hash-active > td {
  @include theme.use {
    background: color.mix(theme.get('strong-color'), theme.get('background'), 20%);
  }
}
</style>
