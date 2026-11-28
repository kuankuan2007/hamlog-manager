<template>
  <div class="box">
    <h1>新增 QSL 发件记录</h1>
    <form @submit.prevent="submitForm">
      <p>呼号：<KInputCallsign id="callsign" v-model="args.callsign" required /></p>
      <p>
        发送日期：
        <input
          v-url-hash-focus="'sent-at'"
          v-model="args.sentAt"
          type="date"
          name="sentAt"
          required
        />
      </p>
      <p>
        快递单号：
        <input
          v-url-hash-focus="'tracking-number'"
          v-model="args.trackingNumber"
          type="text"
          name="trackingNumber"
        />
      </p>
      <p>
        <button type="submit" :disabled="submitting">{{ submitting ? '提交中' : '提交' }}</button>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { type CreateQSLSendInput, newQSLSend } from '@/api/update';
import KInputCallsign from '@/components/input/KInputCallsign.vue';
import { broadcastEventCenter } from '@/scripts/broadcast';
import { getCurrentTimeTagString } from '@util/time';
import { DateTagField, getURLArgs } from '@/scripts/urlArgs';
import { vUrlHashFocus } from '@/scripts/urlHash';

const args = getURLArgs({
  callsign: { type: 'string' },
  sentAt: new DateTagField(getCurrentTimeTagString().slice(0, 10)),
  trackingNumber: { type: 'string' },
});
const submitting = ref(false);

async function submitForm() {
  const options: CreateQSLSendInput = {
    callsign: args.callsign,
    sentAt: args.sentAt,
    trackingNumber: args.trackingNumber.trim() || undefined,
  };

  submitting.value = true;
  try {
    const record = await newQSLSend(options);
    broadcastEventCenter.emit('update', {
      type: 'qsl-send',
      id: record.id,
      callsign: record.callsign,
    });
    alert('提交成功');
  } catch (error) {
    alert(`提交失败: ${error}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}
</style>
