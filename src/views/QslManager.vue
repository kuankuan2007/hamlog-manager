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
  </div>
</template>

<script setup lang="ts">
import { selectQSLReceives, selectQSLSends } from '@/api/select';
import type { QSLReceive, QSLSend, QSLSendStatus } from '@schema/qsl';

const qslSends = ref<QSLSend[]>([]);
const qslReceives = ref<QSLReceive[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function formatStatus(status: QSLSendStatus | null): string {
  if (status === 'received') return '已收到';
  if (status === 'returned') return '已退回';
  return '待确认';
}

async function loadRecords() {
  loading.value = true;
  error.value = null;
  try {
    [qslSends.value, qslReceives.value] = await Promise.all([
      selectQSLSends(),
      selectQSLReceives(),
    ]);
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
header{
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
