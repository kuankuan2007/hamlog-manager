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
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.address + record.postalCode + record.updatedAt">
          <td>{{ record.callsign }}</td>
          <td>{{ record.postalCode }}</td>
          <td>{{ record.address }}</td>
          <td>{{ record.recipientName ?? '—' }}</td>
          <td>{{ record.updatedAt }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Address } from '@schema/address';
import getShowText from '@/scripts/showText';

defineProps<{
  records: Address[];
}>();
</script>

<style scoped lang="scss">
.table-wrapper {
  overflow-x: auto;
}
</style>
