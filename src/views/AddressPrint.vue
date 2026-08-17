<template>
  <div class="address-box">
    <ol class="address-list">
      <li v-for="address in printData" :key="address.callsign" class="address-item">
        <p class="postal-code">{{ address.postalCode }}</p>
        <p class="address">{{ address.address }}</p>
        <p class="recipient">{{ address.callsign }} {{ address.recipientName ?? '' }} 收</p>
        <p class="sender-address">重庆市两江新区北城天街15号富力海洋广场6-21-3</p>
        <p class="sender">BH8HKH 宽宽 寄</p>
        <p class="sender-postal-code">400020</p>
      </li>
    </ol>
  </div>
</template>
<script setup lang="ts">
import type { CommunicationLog } from '@schema/communicationLog';
import { selectCommunicationLogs } from '@/api/select';

const communicationLogList = ref<CommunicationLog[]>([]);
const printData = computed(() => {
  const filtered = communicationLogList.value
    .filter((log) => log.address && log.qslSent === null)
    .map((log) => ({
      ...log.address,
      callsign: log.callsign,
    }));
  const result: typeof filtered = [];
  for (const item of filtered) {
    if (!result.some((existing) => existing.callsign === item.callsign)) {
      result.push(item);
    }
  }
  return result;
});

selectCommunicationLogs()
  .then((logs) => {
    communicationLogList.value = logs.items;
  })
  .catch((error) => {
    console.error('Error fetching communication logs:', error);
  });
</script>
<style scoped lang="scss">
.address-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3cm;
  font-family:
    Fira Code,
    'Alibaba PuHuiTi 3.0',
    sans-serif;
  justify-items: center;
  align-items: center;
  .address-item {
    break-inside: avoid;
    width: 12cm;
    height: 6cm;
    p {
      margin: 0.2cm 0;
      font-size: 0.5cm;
    }
    .postal-code {
      font-size: 1cm;
      font-weight: bold;
    }
    .address {
      font-size: 0.5cm;
      font-weight: bold;
      text-indent: 1em;
    }
    .recipient {
      margin: 0.5em 0;
      text-align: right;
      font-weight: bold;
    }
    .sender-address {
      font-size: 0.4cm;
      text-indent: 3em;
    }
    .sender {
      font-size: 0.4cm;
      text-align: right;
    }
    .sender-postal-code {
      font-size: 0.5cm;
      text-align: right;
    }
  }
}
</style>
