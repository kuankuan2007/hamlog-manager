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
import type { Address } from '@schema/address';
import { selectAddressesByCallsigns, selectCommunicationLogs } from '@/api/select';

const pageSize = 100;
const printData = ref<Address[]>([]);

async function loadPrintData(): Promise<void> {
  const filters = {
    qslSent: false,
    hasAddress: true,
    deduplicateCallsigns: true,
  };
  const firstPage = await selectCommunicationLogs(1, pageSize, filters);
  const pageCount = Math.ceil(firstPage.total / pageSize);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      selectCommunicationLogs(index + 2, pageSize, filters)
    )
  );
  const callsigns = firstPage.items.concat(...remainingPages.map((page) => page.items))
    .map((log) => log.callsign);
  printData.value = await selectAddressesByCallsigns(callsigns);
}

loadPrintData().catch((error) => {
  console.error('Error fetching print addresses:', error);
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
