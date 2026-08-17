<template>
  <div class="box">
    <table>
      <thead>
        <tr>
          <th rowspan="2">Time</th>
          <th rowspan="2">Callsign</th>
          <th rowspan="2">Frequency</th>
          <th rowspan="2">Mode</th>
          <th colspan="2">RST</th>
          <th colspan="2">QSL</th>
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
        <tr v-for="log in communicationLogList" :key="log.sequenceNumber">
          <td>{{ log.time }}</td>
          <td>{{ showCallsign ? log.callsign : 'XXXXXX' }}</td>
          <td>{{ log.frequency.toFixed(3) }}</td>
          <td>{{ log.mode }}</td>
          <td>{{ log.rxReport }}</td>
          <td>{{ log.txReport }}</td>
          <td>{{ log.qslReceived?.receivedAt ?? '-' }}</td>
          <td>{{ log.qslSent?.sentAt ?? '-' }}</td>
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
              EN
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="button-list">
      <button @click="showCallsign = !showCallsign">
        {{ showCallsign ? '隐藏呼号' : '显示呼号' }}
      </button>
    </div>
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
}
.box table {
  border-collapse: collapse;
  font-family:
    Fira Code,
    'Alibaba PuHuiTi 3.0',
    sans-serif;
  th {
    text-align: center;
    font-weight: bold;
  }
  td {
    text-align: right;
  }
  th,
  td {
    padding: 0.2em 0.5em;
    border: 1px solid;
    @include theme.use {
      border-color: rgba(theme.get('color'), 50%);
    }
    border-collapse: collapse;
  }
  button.link-like {
    background: none;
    border: none;
    outline: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    @include theme.use {
      color: theme.mix('color', 'active-color', 50%);
    }
  }
}
.button-list {
  padding: 0.5em;
}
</style>
