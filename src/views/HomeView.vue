<template>
  <div class="box">
    <div class="button-list">
      <button @click="showCallsign = !showCallsign">
        {{ showCallsign ? '隐藏呼号' : '显示呼号' }}
      </button>
      <a href="/new-log" target="_blank">新建日志</a>
      <a href="/callsign-search" target="_blank">呼号搜索</a>
    </div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">序号</th>
          <th rowspan="2">Time</th>
          <th rowspan="2">Callsign</th>
          <th rowspan="2">Frequency</th>
          <th rowspan="2">Mode</th>
          <th colspan="2">RST</th>
          <th colspan="2">QSL</th>
          <th rowspan="2">操作</th>
          <th rowspan="2">复制</th>
        </tr>
        <tr>
          <th>RX</th>
          <th>TX</th>
          <th>Received</th>
          <th>Sent</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in communicationLogList" :key="log.id">
          <td>{{ log.sequenceNumber }}</td>
          <td>{{ log.time }}</td>
          <td>{{ showCallsign ? log.callsign : 'XXXXXX' }}</td>
          <td>{{ log.frequency.toFixed(3) }}</td>
          <td>{{ log.mode }}</td>
          <td>{{ log.rxReport }}</td>
          <td>{{ log.txReport }}</td>
          <td>{{ log.qslReceived ? '是' : '-' }}</td>
          <td>{{ log.qslSent ? '是' : '-' }}</td>
          <td>
            <a :href="`/callsign/${log.callsign}#log-id-${log.id}`" target="_blank">详情</a>|<a :href="`/new-log?callsign=${log.callsign}`" target="_blank">新建</a>
          </td>
          <td>
            <button
              class="link-like"
              @click="
                () => {
                  copyText(formatContactContentCN(log));
                }
              "
            >
              CN</button
            >|<button
              class="link-like"
              @click="
                () => {
                  copyText(formatContactContentEN(log));
                }
              "
            >
              EN</button
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import type { CommunicationLog } from '@schema/communicationLog';
import { copyText } from '@kuankuan/assist-2026/utils/copyText';
import { selectCommunicationLogs } from '@/api/select';
const communicationLogList = ref<CommunicationLog[]>([]);
const showCallsign = ref(true);
function formatContactContentCN(log: CommunicationLog): string {
  return `通信时间: ${log.time} UTC\n呼号: ${log.callsign}\n频率: ${log.frequency.toFixed(3)} MHz\n模式: ${log.mode}\n信号报告：收 ${log.rxReport}\t发: ${log.txReport}`;
}
function formatContactContentEN(log: CommunicationLog): string {
  return `Time: ${log.time} UTC\nCallsign: ${log.callsign}\nFrequency: ${log.frequency.toFixed(3)} MHz\nMode: ${log.mode}\nSignal Report: RX ${log.rxReport}\tTX: ${log.txReport}`;
}

selectCommunicationLogs()
  .then((logs) => {
    communicationLogList.value = logs.items;
  })
  .catch((error) => {
    console.error('Error fetching communication logs:', error);
  });
</script>
<style scoped lang="scss">
.box {
  position: relative;
  padding: 1em;
}

.button-list {
  padding: 0.5em;
  a,
  button {
    padding: 0.2em 0.5em;
    border-radius: 4px;
    border: 1px solid;
    background-color: transparent;
    margin-left: 0.5em;
    text-decoration: none;
    font-size: 1em;
    @include theme.use {
      color: theme.mix('color', 'active-color', 50%);
      border-color: theme.mix('color', 'active-color', 50%);
    }
  }
}
</style>
