<template>
  <div class="box">
    <h1>{{ callsign.toUpperCase() }}</h1>
    <div class="email">
      <span v-if="emailInfo?.email"
        ><a :href="'mailto:' + emailInfo.email">{{ emailInfo.email }}</a></span
      >
      <span v-else>无数据</span>
      <span class="email-tag">{{
        emailInfo?.realtime ? '实时' : emailInfo?.lastUpdate ? emailInfo.lastUpdate : '非实时'
      }}</span>
      <button class="email-refresh-button" @click="refreshEmailInfo" type="button">刷新</button>
      <span class="email-tag" v-if="emailLoading">加载中</span>
    </div>
    <div class="info-box" v-if="detail">
      <div class="basic" id="basic">
        <h2>基础信息</h2>
        <table v-if="detail?.basic">
          <thead>
            <tr>
              <th>{{ getShowText('callsign') }}</th>
              <th>{{ getShowText('communicationCount') }}</th>
              <th>{{ getShowText('lastCommunicationAt') }}</th>
              <th>{{ getShowText('firstCommunicationAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ detail.basic.callsign }}</td>
              <td>{{ detail.basic.communicationCount }}</td>
              <td>{{ detail.basic.lastCommunicationAt }}</td>
              <td>{{ detail.basic.firstCommunicationAt }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>暂无基本信息</p>
      </div>
      <div class="address-info" id="address">
        <h2>地址信息</h2>
        <div v-if="detail.addresses && detail.addresses.length">
          <table>
            <thead>
              <tr>
                <th>{{ getShowText('callsign') }}</th>
                <th>{{ getShowText('postalCode') }}</th>
                <th>{{ getShowText('address') }}</th>
                <th>{{ getShowText('recipientName') }}</th>
                <th>{{ getShowText('updatedAt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="address in detail.addresses"
                :key="address.address + address.postalCode + address.updatedAt"
              >
                <td>{{ address.callsign }}</td>
                <td>{{ address.postalCode }}</td>
                <td>{{ address.address }}</td>
                <td>{{ address.recipientName }}</td>
                <td>{{ address.updatedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>暂无地址信息</p>
      </div>
      <div class="qsl-info" id="qsl">
        <h2>QSL收发信息</h2>
        <div class="qsl-send" id="qsl-send">
          <h3>QSL发送</h3>
          <table v-if="detail.qslSends && detail.qslSends.length">
            <thead>
              <tr>
                <th>{{ getShowText('callsign') }}</th>
                <th>{{ getShowText('sentAt') }}</th>
                <th>{{ getShowText('confirmedAt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in detail.qslSends" :key="record.callsign + record.sentAt">
                <td>{{ record.callsign }}</td>
                <td>{{ record.sentAt }}</td>
                <td>{{ record.confirmedAt }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else>暂无QSL发送信息</p>
        </div>
        <div class="qsl-receive" id="qsl-receive">
          <h3>QSL接收</h3>
          <table v-if="detail.qslReceives && detail.qslReceives.length">
            <thead>
              <tr>
                <th>{{ getShowText('callsign') }}</th>
                <th>{{ getShowText('receivedAt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in detail.qslReceives" :key="record.callsign + record.receivedAt">
                <td>{{ record.callsign }}</td>
                <td>{{ record.receivedAt }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else>暂无QSL接收信息</p>
        </div>
        <div class="communication-log" id="log">
          <table v-if="detail.communicationLogs && detail.communicationLogs.length">
            <thead>
              <tr>
                <th>{{ getShowText('sequenceNumber') }}</th>
                <th>{{ getShowText('callsign') }}</th>
                <th>{{ getShowText('time') }}</th>
                <th>{{ getShowText('frequency') }}</th>
                <th>{{ getShowText('mode') }}</th>
                <th>{{ getShowText('rxReport') }}</th>
                <th>{{ getShowText('txReport') }}</th>
                <th>{{ getShowText('summary') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in detail.communicationLogs"
                :key="record.id"
                :id="`log-id-${record.id}`"
              >
                <td>{{ record.sequenceNumber }}</td>
                <td>{{ record.callsign }}</td>
                <td>{{ record.time }}</td>
                <td>{{ record.frequency }}</td>
                <td>{{ record.mode }}</td>
                <td>{{ record.rxReport }}</td>
                <td>{{ record.txReport }}</td>
                <td>{{ record.summary }}</td>
              </tr>
            </tbody>
          </table>
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
import { selectCallsignDetail, type CallsignDetail } from '@/api/select';
import type { Callsign2EmailResponse } from '@/api/schema';
import getShowText from '@/scripts/showText';

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
</script>
<style scoped lang="scss">
.box {
  padding: 1em;
}
.email-tag,
.email-refresh-button {
  margin-left: 0.5em;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  border: 1px solid;
  font-size: 0.8em;
  background-color: transparent;
  @include theme.use {
    border-color: theme.mix('color', 'background', 50%);
  }
}
.email-refresh-button {
  cursor: pointer;
}
</style>
