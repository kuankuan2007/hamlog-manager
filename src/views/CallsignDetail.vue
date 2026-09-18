<template>
  <div class="box">
    <h1>{{ callsign.toUpperCase() }}</h1>
    <div class="quick-link">
      <a class="qrz-link" :href="`https://www.qrz.com/db/${callsign.toUpperCase()}`" target="_blank"
        >QRZ.com</a
      >
    </div>
    <div class="email">
      <span v-if="emailInfo?.email"
        ><a :href="'mailto:' + emailInfo.email">{{ emailInfo.email }}</a>
        <button class="email-copy-button" type="button" @click="copyEmail">复制邮箱</button></span
      >
      <span v-else>无数据</span>
      <span class="email-tag">{{ emailSourceLabel }}</span>
      <button class="email-refresh-button" @click="refreshEmailInfo" type="button">刷新</button>
      <a class="update-email-button" :href="`/manual-email?callsign=${callsign}`" target="_blank"
        >手动更新邮箱</a
      >
      <span class="email-tag" v-if="emailLoading">加载中</span>
    </div>
    <div class="info-box" v-if="detail">
      <div class="basic" id="basic">
        <h2>基础信息</h2>
        <CallsignBasicTable v-if="detail?.basic" :record="detail.basic" />
        <p v-else>暂无基本信息</p>
      </div>
      <div class="address-info" id="address">
        <h2>地址信息</h2>
        <AddressTable
          v-if="detail.addresses && detail.addresses.length"
          :records="detail.addresses"
        />
        <p v-else>
          暂无地址信息，<a
            class="new-address-button"
            :href="`/new-address?callsign=${callsign}`"
            target="_blank"
            >新增地址</a
          >
        </p>
      </div>
      <div class="qsl-info" id="qsl">
        <h2>QSL收发信息</h2>
        <QslActionBar :callsign="callsign" />
        <div class="qsl-send" id="qsl-send">
          <h3>QSL发送</h3>
          <QslSendTable
            v-if="detail.qslSends && detail.qslSends.length"
            :records="detail.qslSends"
          />
          <p v-else>暂无QSL发送信息</p>
        </div>
        <div class="qsl-receive" id="qsl-receive">
          <h3>QSL接收</h3>
          <QslReceiveTable
            v-if="detail.qslReceives && detail.qslReceives.length"
            :records="detail.qslReceives"
          />
          <p v-else>暂无QSL接收信息</p>
        </div>
        <div class="communication-log" id="log">
          <h2>通联信息</h2>
          <CommunicationLogTable
            v-if="detail.communicationLogs && detail.communicationLogs.length"
            :records="detail.communicationLogs"
            row-id-prefix="log-id-"
          />
          <p v-else>暂无通联信息</p>
        </div>
      </div>
    </div>
    <div class="info-box-empty" v-else-if="detailError">
      <h2>Error:</h2>
      <p>{{ detailError }}</p>
    </div>
    <div class="info-box-empty" v-else>暂无信息</div>
  </div>
</template>
<script setup lang="ts">
import { callsign2email } from '@/api/auto';
import AddressTable from '@/components/dataDisplay/AddressTable.vue';
import CallsignBasicTable from '@/components/dataDisplay/CallsignBasicTable.vue';
import CommunicationLogTable from '@/components/dataDisplay/CommunicationLogTable.vue';
import QslActionBar from '@/components/dataDisplay/QslActionBar.vue';
import QslReceiveTable from '@/components/dataDisplay/QslReceiveTable.vue';
import QslSendTable from '@/components/dataDisplay/QslSendTable.vue';
import { selectCallsignDetail, type CallsignDetail } from '@/api/select';
import type { Callsign2EmailResponse } from '@/api/schema';
import { copyText } from '@kuankuan/assist-2026/utils/copyText';

const detail = ref<CallsignDetail | null>(null);
const props = defineProps<{
  callsign: string;
}>();

function refreshEmailInfo() {
  if (!props.callsign) return;
  getEmail(props.callsign, true);
}

const detailError = ref<string | null>(null);
const emailInfo = ref<Callsign2EmailResponse | null>(null);
const emailSourceLabel = computed(() => {
  if (!emailInfo.value) return '非实时';
  if (emailInfo.value.realtime) return '实时';
  if (emailInfo.value.comeFrom === 'manual') return '手动';
  return emailInfo.value.lastUpdate ?? '非实时';
});
async function getDetails(callsign: string) {
  selectCallsignDetail(callsign)
    .then((res) => {
      if (props.callsign !== callsign) return;
      detail.value = res;
      detailError.value = null;
    })
    .catch((err) => {
      detail.value = null;
      detailError.value = String(err);
    });
}
const emailError = ref<string | null>(null);
const emailLoading = ref(false);
function getEmail(callsign: string, realtime: boolean = false) {
  emailLoading.value = true;
  callsign2email(callsign, realtime ? 'fallback' : 'cache')
    .then((res) => {
      if (props.callsign !== callsign) return;
      emailInfo.value = res;
      emailError.value = null;
    })
    .catch((err) => {
      emailError.value = String(err);
      emailInfo.value = null;
    })
    .finally(() => {
      emailLoading.value = false;
    });
}
function init() {
  detail.value = null;
  detailError.value = null;
  emailInfo.value = null;
  emailError.value = null;
}
watch(
  () => props.callsign,
  (callsign) => {
    if (!callsign) return;
    init();
    getDetails(callsign);
    getEmail(callsign, false);
  },
  { immediate: true }
);

function copyEmail() {
  if (!emailInfo.value?.email) return;
  copyText(emailInfo.value.email);
  alert('邮箱已复制');
}
</script>
<style scoped lang="scss">
.box {
  padding: 1em;
}
.quick-link {
  display: flex;
  gap: 0.5em;
  flex-wrap: wrap;
  margin-bottom: 1em;
  a {
    display: block;
  }
}
.email-tag,
.email-refresh-button,
.email-copy-button,
.update-email-button {
  margin-left: 0.5em;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  border: 1px solid;
  font-size: 0.8em;
  background-color: transparent;
  @include theme.use {
    border-color: theme.mix('color', 'background', 50%);
    color: theme.get('color');
  }
}
.email-refresh-button,
.email-copy-button,
.update-email-button {
  cursor: pointer;
}
a.new-address-button {
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
</style>
