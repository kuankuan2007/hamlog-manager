<template>
  <div class="box">
    <header class="page-header">
      <h1>QSL 管理</h1>
      <a href="/new-qsl-send" target="_blank">新增发件</a>
      <a href="/new-qsl-receive" target="_blank">新增收件</a>
    </header>

    <p v-if="error" class="error">加载失败：{{ error }}</p>

    <section>
      <h2>QSL 发件记录</h2>
      <div class="table-wrapper" v-if="qslSends.length">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>呼号</th>
              <th>发送日期</th>
              <th>确认日期</th>
              <th>状态</th>
              <th>物流单号</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in qslSends" :key="record.id">
              <td>{{ record.id }}</td>
              <td>
                {{ record.callsign }}
              </td>
              <td>{{ record.sentAt }}</td>
              <td>{{ record.confirmedAt ?? '—' }}</td>
              <td>{{ formatStatus(record.status) }}</td>
              <td>{{ record.trackingNumber ?? '—' }}</td>
              <td>
                <a :href="`/callsign/${encodeURIComponent(record.callsign)}`">详情</a>|<a
                  :href="`/confirm-qsl-send?id=${record.id}`"
                >
                  {{ record.confirmedAt === null ? '确认' : '更新' }}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!loading">暂无 QSL 发件记录</p>
    </section>

    <section>
      <h2>QSL 收件记录</h2>
      <div class="table-wrapper" v-if="qslReceives.length">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>呼号</th>
              <th>收件日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in qslReceives" :key="record.id">
              <td>{{ record.id }}</td>
              <td>
                <RouterLink :to="`/callsign/${encodeURIComponent(record.callsign)}`">
                  {{ record.callsign }}
                </RouterLink>
              </td>
              <td>{{ record.receivedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
import type { CommunicationLog } from '@schema/communicationLog';
import type { QSLReceive, QSLSend, QSLSendStatus } from '@schema/qsl';

type UnsentQSLLogReason = 'unsent' | 'returned';

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
  return reason === 'returned' ? '被退回' : '未发送';
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
  const returnedCallsigns = [...latestSendByCallsign.values()]
    .filter((record) => record.status === 'returned')
    .map((record) => record.callsign);

  const unsentRows: UnsentQSLLogRow[] = unsentLogs.map((record) => ({
    ...record,
    reason: 'unsent',
  }));

  if (returnedCallsigns.length === 0) {
    return unsentRows.sort(byNewestTimeDesc);
  }

  const returnedLogs = await Promise.all(
    returnedCallsigns.map((callsign) => selectCommunicationLogsByCallsign(callsign))
  );

  const latestReturnedLogs = returnedLogs
    .map((records) => records.find((record) => record.hasAddress))
    .filter((record): record is CommunicationLog => record !== undefined)
    .map((record) => ({
      ...record,
      reason: 'returned' as const,
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

function formatStatus(status: QSLSendStatus | null): string {
  if (status === 'received') return '已收到';
  if (status === 'returned') return '已退回';
  return '待确认';
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
  a {
    padding: 0.2em 0.5em;
    border: 1px solid;
    border-radius: 4px;
    background: transparent;
    text-decoration: none;
    font-size: 1em;
    margin-right: 0.75em;
    @include theme.use {
      color: theme.mix('color', 'active-color', 50%);
      border-color: theme.mix('color', 'active-color', 50%);
    }
  }
}
section {
  margin-top: 2em;
}

.table-wrapper {
  overflow-x: auto;
}
</style>
