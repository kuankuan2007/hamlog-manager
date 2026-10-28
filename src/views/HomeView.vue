<template>
  <div class="box">
    <div class="button-list">
      <button @click="toggleCallsignVisibility">
        {{ showCallsign ? '隐藏呼号' : '显示呼号' }}
      </button>
      <a href="/new-log" target="_blank">新建日志</a>
      <a href="/callsign-search" target="_blank">呼号搜索</a>
      <a href="/address-list" target="_blank">地址列表</a>
      <a href="/qsl-manager" target="_blank">QSL 管理</a>
      <a href="/communication-proof" target="_blank">通联证明</a>
    </div>
    <CommunicationLogTable
      :records="communicationLogList"
      :show-callsign="showCallsign"
      :show-qsl-status="true"
      :show-address="true"
      :show-summary="false"
    >
      <template #callsign="{ record }">
        {{ showCallsign ? record.callsign : 'XXXXXX' }}
      </template>
    </CommunicationLogTable>
  </div>
</template>
<script setup lang="ts">
import type { CommunicationLog } from '@schema/communicationLog';
import CommunicationLogTable from '@/components/dataDisplay/CommunicationLogTable.vue';
import { selectCommunicationLogs } from '@/api/select';
import { getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({
  showCallsign: { type: 'choice', values: ['true', 'false'], default: 'true' },
});
const showCallsign = computed(() => args.showCallsign === 'true');
const communicationLogList = ref<CommunicationLog[]>([]);

function toggleCallsignVisibility(): void {
  args.showCallsign = showCallsign.value ? 'false' : 'true';
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
