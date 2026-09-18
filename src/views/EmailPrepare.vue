<template>
  <div class="box">
    <h1>准备邮件</h1>
    <p v-if="loading">加载中...</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <div v-else-if="prepared">
      <section class="source-section" v-if="prepared.source.kind === 'qslSend'">
        <h2>原始数据</h2>
        <QslSendTable :records="[prepared.source.record]" :show-actions="false" />
      </section>
      <section class="source-section" v-else-if="prepared.source.kind === 'qslReceive'">
        <h2>原始数据</h2>
        <QslReceiveTable :records="[prepared.source.record]" :show-actions="false" />
        <p class="source-note">
          最近一次 QSL 发件日期：{{ prepared.source.latestQslSentAt ?? '无' }}
        </p>
      </section>
      <section class="source-section" v-else-if="prepared.source.kind === 'communicationLog'">
        <h2>原始数据</h2>
        <CommunicationLogTable
          :records="[prepared.source.record]"
          :show-actions="false"
          :show-summary="true"
        />
        <div v-if="prepared.source.address" class="address-source">
          <h3>使用的地址</h3>
          <AddressTable :records="[prepared.source.address]" />
        </div>
        <p v-else class="source-note">当前没有可用于邮件正文的地址记录。</p>
      </section>
      <p>收件人：{{ prepared.to }}</p>
      <p>标题：{{ prepared.title }}</p>
      <p>
        <a :href="sendHref" target="_blank" rel="noopener noreferrer">进入发送页面</a>
      </p>
      <textarea :value="prepared.content" rows="16" readonly />
    </div>
    <p v-else>缺少邮件准备参数。</p>
  </div>
</template>

<script setup lang="ts">
import type { Address } from '@schema/address';
import type { CallsignDetail, CommunicationLog } from '@schema/communicationLog';
import type { QSLReceive, QSLSend } from '@schema/qsl';
import {
  selectCallsignDetail,
  selectCommunicationLogById,
  selectQSLReceiveById,
  selectQSLSendById,
} from '@/api/select';
import AddressTable from '@/components/dataDisplay/AddressTable.vue';
import CommunicationLogTable from '@/components/dataDisplay/CommunicationLogTable.vue';
import QslReceiveTable from '@/components/dataDisplay/QslReceiveTable.vue';
import QslSendTable from '@/components/dataDisplay/QslSendTable.vue';
import {
  createQSLReceivedConfirmMailContent,
  createQSOConfirmMailContent,
  createQSLSentMailContent,
} from '@/scripts/mailContent';
import { selfInfoData } from '@/scripts/selfInfo';
import { buildSendEmailHref, type EmailPrepareRouteProps } from '@/scripts/sendEmail';

type PreparedSource =
  | { kind: 'qslSend'; record: QSLSend }
  | { kind: 'qslReceive'; record: QSLReceive; latestQslSentAt?: string }
  | { kind: 'communicationLog'; record: CommunicationLog; address?: Address };

interface PreparedEmail {
  title: string;
  to: string;
  content: string;
  source: PreparedSource;
}

const props = defineProps<EmailPrepareRouteProps>();

const loading = ref(false);
const error = ref<string | null>(null);
const prepared = ref<PreparedEmail | null>(null);

function formatAddress(address?: Address): string | undefined {
  if (!address) return undefined;
  const recipient = address.recipientName ? ` ${address.recipientName} 收` : '';
  return `${address.postalCode} ${address.address}${recipient}`;
}

function getLatestQslSentAt(detail: CallsignDetail, callsign: string): string | undefined {
  return detail.qslSends
    .filter((record) => record.callsign === callsign)
    .sort((left, right) => right.sentAt.localeCompare(left.sentAt))[0]?.sentAt;
}

function getLatestQslSend(detail: CallsignDetail, callsign: string): QSLSend | undefined {
  return detail.qslSends
    .filter((record) => record.callsign === callsign)
    .sort((left, right) => right.sentAt.localeCompare(left.sentAt))[0];
}

function getLatestQslReceive(detail: CallsignDetail, callsign: string): QSLReceive | undefined {
  return detail.qslReceives
    .filter((record) => record.callsign === callsign)
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))[0];
}

async function requireCallsignDetail(callsign: string): Promise<CallsignDetail> {
  return await selectCallsignDetail(callsign);
}

async function prepareQslSendEmail(id: number): Promise<PreparedEmail> {
  const record = await selectQSLSendById(id);
  if (!record) throw new Error(`未找到 ID=${id} 的 QSL 发件记录`);

  return {
    title: '您的QSL卡片已寄出',
    to: record.callsign,
    content: createQSLSentMailContent({
      callsign: record.callsign,
      qslSentDate: record.sentAt,
      trackingNumber: record.trackingNumber ?? undefined,
    }),
    source: {
      kind: 'qslSend',
      record,
    },
  };
}

async function prepareQslReceiveEmail(id: number): Promise<PreparedEmail> {
  const record = await selectQSLReceiveById(id);
  if (!record) throw new Error(`未找到 ID=${id} 的 QSL 收件记录`);

  const detail = await requireCallsignDetail(record.callsign);
  const latestQslSentAt = getLatestQslSentAt(detail, record.callsign);
  return {
    title: '您的QSL卡片已收妥',
    to: record.callsign,
    content: createQSLReceivedConfirmMailContent({
      callsign: record.callsign,
      qslReceivedDate: record.receivedAt,
      qslSendDate: latestQslSentAt,
    }),
    source: {
      kind: 'qslReceive',
      record,
      latestQslSentAt,
    },
  };
}

async function prepareQsoConfirmEmail(id: number): Promise<PreparedEmail> {
  const record = await selectCommunicationLogById(id);
  if (!record) throw new Error(`未找到 ID=${id} 的通联记录`);

  const detail = await requireCallsignDetail(record.callsign);
  const address = detail.addresses[0];
  return {
    title: `来自${selfInfoData.callsign}的QSO确认`,
    to: record.callsign,
    content: createQSOConfirmMailContent({
      callsign: record.callsign,
      time: record.time,
      frequency: record.frequency,
      mode: record.mode,
      rst: { rx: record.rxReport, tx: record.txReport },
      address: formatAddress(address),
      qslSend: getLatestQslSend(detail, record.callsign) ?? null,
      qslReceive: getLatestQslReceive(detail, record.callsign) ?? null,
    }),
    source: {
      kind: 'communicationLog',
      record,
      address,
    },
  };
}

const sendHref = computed(() => {
  if (!prepared.value) return '/send-email';
  return buildSendEmailHref({
    title: prepared.value.title,
    to: prepared.value.to,
    content: prepared.value.content,
  });
});

async function loadPreparedEmail(): Promise<void> {
  loading.value = true;
  error.value = null;
  prepared.value = null;
  try {
    const candidateCount = [props.qslSendId, props.qslReceiveId, props.communicationLogId].filter(
      (value): value is number => value !== undefined
    ).length;
    if (candidateCount !== 1) throw new Error('必须且只能提供一个邮件准备参数');

    if (props.qslSendId !== undefined) {
      prepared.value = await prepareQslSendEmail(props.qslSendId);
      return;
    }
    if (props.qslReceiveId !== undefined) {
      prepared.value = await prepareQslReceiveEmail(props.qslReceiveId);
      return;
    }
    if (props.communicationLogId !== undefined) {
      prepared.value = await prepareQsoConfirmEmail(props.communicationLogId);
      return;
    }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.qslSendId, props.qslReceiveId, props.communicationLogId],
  () => {
    void loadPreparedEmail();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}

.error {
  color: #c62828;
}

.source-section {
  margin-bottom: 1.5em;
}

.source-note {
  margin-top: 0.75em;
}

.address-source {
  margin-top: 1em;
}

textarea {
  width: min(100%, 50rem);
  display: block;
  resize: vertical;
}

a {
  padding: 0.2em 0.5em;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  text-decoration: none;
  font-size: 1em;
  @include theme.use {
    color: theme.mix('color', 'active-color', 50%);
    border-color: theme.mix('color', 'active-color', 50%);
  }
}
</style>
