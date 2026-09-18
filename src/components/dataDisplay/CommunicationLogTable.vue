<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th rowspan="2">{{ getShowText('id') }}</th>
          <th rowspan="2">{{ getShowText('sequenceNumber') }}</th>
          <th rowspan="2">{{ getShowText('time') }}</th>
          <th rowspan="2" v-if="showCallsign">{{ getShowText('callsign') }}</th>
          <th rowspan="2">{{ getShowText('frequency') }}</th>
          <th rowspan="2">{{ getShowText('mode') }}</th>
          <th colspan="2">{{ getShowText('rst') }}</th>
          <th colspan="2" v-if="showQslStatus">{{ getShowText('qsl') }}</th>
          <th rowspan="2" v-if="showAddress">{{ getShowText('address') }}</th>
          <th rowspan="2" v-if="showSummary">{{ getShowText('summary') }}</th>
          <th rowspan="2" v-if="showActions">{{ actionLabel }}</th>
        </tr>
        <tr>
          <th>{{ getShowText('rx') }}</th>
          <th>{{ getShowText('tx') }}</th>

          <th rowspan="2" v-if="showQslStatus">{{ getShowText('received') }}</th>
          <th rowspan="2" v-if="showQslStatus">{{ getShowText('sent') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="record in records"
          :key="record.id"
          :id="rowIdPrefix ? `${rowIdPrefix}${record.id}` : undefined"
        >
          <td>{{ record.id }}</td>
          <td>{{ record.sequenceNumber }}</td>
          <td>{{ record.time }}</td>
          <td v-if="showCallsign">
            <slot name="callsign" :record="record">{{ record.callsign }}</slot>
          </td>
          <td>{{ record.frequency.toFixed(3) }}</td>
          <td>{{ record.mode }}</td>
          <td>{{ record.rxReport }}</td>
          <td>{{ record.txReport }}</td>
          <td v-if="showQslStatus">{{ record.qslReceived ? '是' : '-' }}</td>
          <td v-if="showQslStatus">{{ record.qslSent ? '是' : '-' }}</td>
          <td v-if="showAddress">{{ record.hasAddress ? '是' : '-' }}</td>
          <td v-if="showSummary">{{ record.summary ?? '—' }}</td>
          <td v-if="showActions">
            <DataActionBar :actions="getActions(record)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { CommunicationLog } from '@schema/communicationLog';
import DataActionBar, { type DataAction } from '@/components/dataDisplay/DataActionBar.vue';
import { buildEmailPrepareHref } from '@/scripts/sendEmail';
import getShowText from '@/scripts/showText';

const props = withDefaults(
  defineProps<{
    records: CommunicationLog[];
    showCallsign?: boolean;
    showSummary?: boolean;
    showQslStatus?: boolean;
    showAddress?: boolean;
    rowIdPrefix?: string;
    actionLabel?: string;
    showActions?: boolean;
  }>(),
  {
    showCallsign: true,
    showSummary: true,
    showQslStatus: false,
    showAddress: false,
    rowIdPrefix: '',
    actionLabel: '操作',
    showActions: true,
  }
);

const {
  records,
  showCallsign,
  showSummary,
  showQslStatus,
  showAddress,
  rowIdPrefix,
  actionLabel,
  showActions,
} = toRefs(props);

function getActions(record: CommunicationLog): DataAction[] {
  return [
    {
      label: '详情',
      href: `/callsign/${encodeURIComponent(record.callsign)}#${rowIdPrefix.value || 'log-id-'}${record.id}`,
    },
    {
      label: '新建',
      href: `/new-log?callsign=${encodeURIComponent(record.callsign)}`,
      target: '_blank',
    },
    {
      label: '发送邮件',
      href: buildEmailPrepareHref({ communicationLogId: record.id }),
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
