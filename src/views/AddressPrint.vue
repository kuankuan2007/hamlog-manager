<template>
  <div class="address-box">
    <p v-if="error">{{ error }}</p>
    <p v-else-if="printData.length === 0">暂无地址</p>
    <ol class="address-list">
      <li v-for="address in printData" :key="address.callsign" class="address-item">
        <p class="postal-code">{{ address.postalCode }}</p>
        <p class="address">{{ address.address }}</p>
        <p class="recipient">{{ address.callsign }} {{ address.recipientName ?? '' }} 收</p>
        <p class="sender-address">{{ selfInfoData.address.address }}</p>
        <p class="sender">{{ selfInfoData.callsign }} {{ selfInfoData.address.recipientName }} 寄</p>
        <p class="sender-postal-code">{{ selfInfoData.address.postalCode }}</p>
      </li>
    </ol>
  </div>
</template>
<script setup lang="ts">
import type { Address } from '@schema/address';
import { selectAddressesByCallsigns } from '@/api/select';
import { selfInfoData } from '@/scripts/selfInfo';
const props = defineProps<{
  callsigns: string;
}>();
const error = ref<string>();
const callsignList = computed(() =>
  props.callsigns ? props.callsigns.split(',').map((callsign) => callsign.trim()) : []
);
const printData = ref<Address[]>([]);

async function loadPrintData(): Promise<void> {
  printData.value = await selectAddressesByCallsigns(callsignList.value);
}
watch(callsignList, loadPrintData, { immediate: true, deep: true });
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
