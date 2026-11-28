<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>{{ getShowText('callsign') }}</th>
          <th>{{ getShowText('receivedAt') }}</th>
          <th v-if="showActions">{{ actionLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="record in records"
          :key="record.id"
          v-url-hash-active="`qsl-receive-id-${record.id}`"
        >
          <td>{{ record.id }}</td>
          <td>{{ record.callsign }}</td>
          <td>{{ record.receivedAt }}</td>
          <td v-if="showActions">
            <DataActionBar :actions="getActions(record)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { QSLReceive } from '@schema/qsl';
import DataActionBar, { type DataAction } from '@/components/dataDisplay/DataActionBar.vue';
import { buildEmailPrepareHref } from '@/scripts/sendEmail';
import getShowText from '@/scripts/showText';
import { vUrlHashActive } from '@/scripts/urlHash';

const props = withDefaults(
  defineProps<{
    records: QSLReceive[];
    actionLabel?: string;
    showActions?: boolean;
  }>(),
  {
    actionLabel: '操作',
    showActions: true,
  }
);

const { records, actionLabel, showActions } = toRefs(props);

function getActions(record: QSLReceive): DataAction[] {
  return [
    {
      label: '详情',
      href: `/callsign/${encodeURIComponent(record.callsign)}#qsl-receive-id-${record.id}`,
    },
    {
      label: '发送邮件',
      href: buildEmailPrepareHref({ qslReceiveId: record.id }),
      target: '_blank',
    },
  ];
}
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
