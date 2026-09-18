<template>
  <div class="box">
    <header class="page-header">
      <h1>QSL 管理</h1>
    </header>

    <QslActionBar />

    <p v-if="error" class="error">加载失败：{{ error }}</p>

    <section>
      <h2>QSL 发件记录</h2>
      <QslSendTable v-if="qslSends.length" :records="qslSends" />
      <p v-else-if="!loading">暂无 QSL 发件记录</p>
    </section>

    <section>
      <h2>QSL 收件记录</h2>
      <QslReceiveTable v-if="qslReceives.length" :records="qslReceives" />
      <p v-else-if="!loading">暂无 QSL 收件记录</p>
    </section>
    <section>
      <h2>未发送QSL列表</h2>
      <div v-if="unsentQSLLogs.length">
        <p>
          <a
            :href="`/address-print?callsigns=${encodeURIComponent(unsentQSLLogs.map((log) => log.callsign).join(','))}`"
            target="_blank"
            >打印地址</a
          >
        </p>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>呼号</th>
                <th>通联时间</th>
                <th>频率</th>
                <th>收报</th>
                <th>发报</th>
                <th>类型</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in unsentQSLLogs" :key="record.id">
                <td>
                  <RouterLink :to="`/callsign/${encodeURIComponent(record.callsign)}`">
                    {{ record.callsign }}
                  </RouterLink>
                </td>
                <td>{{ record.time }}</td>
                <td>{{ record.frequency }}</td>
                <td>{{ record.rxReport }}</td>
                <td>{{ record.txReport }}</td>
                <td>{{ formatUnsentType(record.reason) }}</td>
                <td>
                  <a
                    :href="`/new-qsl-send?callsign=${encodeURIComponent(record.callsign)}`"
                    target="_blank"
                    >新增发件</a
                  >|<a
                    :href="`/edit-address?callsign=${encodeURIComponent(record.callsign)}`"
                    target="_blank"
                    >编辑地址</a
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p v-else-if="!loading">暂无未发送 QSL 的通联记录</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  selectCommunicationLogsByCallsign,
  selectQSLReceives,
  selectQSLSends,
  selectUnsentQSLCommunicationLogs,
} from '@/api/select';
import QslReceiveTable from '@/components/dataDisplay/QslReceiveTable.vue';
import QslActionBar from '@/components/dataDisplay/QslActionBar.vue';
import QslSendTable from '@/components/dataDisplay/QslSendTable.vue';
import type { CommunicationLog } from '@schema/communicationLog';
import type { QSLReceive, QSLSend } from '@schema/qsl';

type FailToSendStatus = 'not_received' | 'returned';
type UnsentQSLLogReason = 'unsent' | FailToSendStatus;

interface UnsentQSLLogRow extends CommunicationLog {
  reason: UnsentQSLLogReason;
}

const qslSends = ref<QSLSend[]>([]);
const qslReceives = ref<QSLReceive[]>([]);
const unsentQSLLogs = ref<UnsentQSLLogRow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function byNewestTimeDesc(a: UnsentQSLLogRow, b: UnsentQSLLogRow): number {
  return b.time.localeCompare(a.time);
}

function formatUnsentType(reason: UnsentQSLLogReason): string {
  if (reason === 'unsent') return '未发送';
  if (reason === 'returned') return '被退回';
  if (reason === 'not_received') return '未收到';
  return `<${reason}>`;
}

async function loadUnsentQSLLogs(qslSendRecords: QSLSend[]): Promise<UnsentQSLLogRow[]> {
  const unsentLogs = await selectUnsentQSLCommunicationLogs();
  const latestSendByCallsign = new Map<string, QSLSend>();
  const sortedSends = [...qslSendRecords].sort((a, b) => {
    const sentAtCompare = b.sentAt.localeCompare(a.sentAt);
    if (sentAtCompare !== 0) return sentAtCompare;
    return b.id - a.id;
  });
  for (const record of sortedSends) {
    if (!latestSendByCallsign.has(record.callsign)) {
      latestSendByCallsign.set(record.callsign, record);
    }
  }
  const failToSendRecords: { callsign: string; status: FailToSendStatus }[] = [
    ...latestSendByCallsign.values(),
  ]
    .filter((record) => record.status === 'returned' || record.status === 'not_received')
    .map((record) => ({ callsign: record.callsign, status: record.status as FailToSendStatus }));

  const unsentRows: UnsentQSLLogRow[] = unsentLogs.map((record) => ({
    ...record,
    reason: 'unsent',
  }));

  if (failToSendRecords.length === 0) {
    return unsentRows.sort(byNewestTimeDesc);
  }

  const failToSendRecordsWithLogs = await Promise.all(
    failToSendRecords.map((record) =>
      selectCommunicationLogsByCallsign(record.callsign).then((logs) => ({
        callsign: record.callsign,
        status: record.status,
        logs,
      }))
    )
  );

  const latestReturnedLogs = failToSendRecordsWithLogs
    .map((records) => ({
      callsign: records.callsign,
      status: records.status,
      records: records.logs.find((log) => log.hasAddress),
    }))
    .filter((record) => record.records !== undefined)
    .map((record) => ({
      ...record.records!,
      reason: record.status,
    }));

  const merged = new Map<string, UnsentQSLLogRow>();
  for (const record of unsentRows) {
    merged.set(record.callsign, record);
  }
  for (const record of latestReturnedLogs) {
    const existing = merged.get(record.callsign);
    if (!existing || record.reason === 'returned' || record.time > existing.time) {
      merged.set(record.callsign, record);
    }
  }

  return [...merged.values()].sort(byNewestTimeDesc);
}

async function loadRecords() {
  loading.value = true;
  error.value = null;
  try {
    const [qslSendRecords, qslReceiveRecords] = await Promise.all([
      selectQSLSends(),
      selectQSLReceives(),
    ]);
    qslSends.value = qslSendRecords;
    qslReceives.value = qslReceiveRecords;
    unsentQSLLogs.value = await loadUnsentQSLLogs(qslSendRecords);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

loadRecords();
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}
header {
  margin-bottom: 1em;
}
section {
  margin-top: 2em;
}
</style>
