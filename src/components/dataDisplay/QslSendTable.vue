<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>{{ getShowText('callsign') }}</th>
          <th>{{ getShowText('sentAt') }}</th>
          <th>{{ getShowText('confirmedAt') }}</th>
          <th>{{ getShowText('status') }}</th>
          <th>{{ getShowText('trackingNumber') }}</th>
          <th v-if="showActions">{{ actionLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td>{{ record.id }}</td>
          <td>{{ record.callsign }}</td>
          <td>{{ record.sentAt }}</td>
          <td>{{ record.confirmedAt ?? '—' }}</td>
          <td>{{ formatStatusValue(record.status) }}</td>
          <td>{{ record.trackingNumber ?? '—' }}</td>
          <td v-if="showActions">
            <DataActionBar :actions="getActions(record)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { QSLSend, QSLSendStatus } from '@schema/qsl';
import DataActionBar, { type DataAction } from '@/components/dataDisplay/DataActionBar.vue';
import { buildEmailPrepareHref } from '@/scripts/sendEmail';
import getShowText from '@/scripts/showText';

const props = withDefaults(
  defineProps<{
    records: QSLSend[];
    actionLabel?: string;
    showActions?: boolean;
  }>(),
  {
    actionLabel: '操作',
    showActions: true,
  }
);

const { records, actionLabel, showActions } = toRefs(props);

function formatStatusValue(status: QSLSendStatus | null): string {
  if (status === 'received') return '已收到';
  if (status === 'returned') return '已退回';
  if (status === 'not_received') return '未收到';
  return '待确认';
}

function getActions(record: QSLSend): DataAction[] {
  return [
    {
      label: '详情',
      href: `/callsign/${encodeURIComponent(record.callsign)}#qsl-send`,
    },
    {
      label: record.confirmedAt === null ? '确认' : '更新',
      href: `/confirm-qsl-send?id=${record.id}`,
      target: '_blank',
    },
    {
      label: '发送邮件',
      href: buildEmailPrepareHref({ qslSendId: record.id }),
      target: '_blank',
    },
  ];
}
</script>

<style scoped lang="scss">
.table-wrapper {
  overflow-x: auto;
}
</style>
