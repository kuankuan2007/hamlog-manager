<template>
  <div class="box">
    <h1>新建日志</h1>
    <form @submit.prevent="submitForm">
      <p>呼号：<k-input-callsign v-model="args.callsign" required /></p>
      <p>RS: 收<k-input-rs v-model="args.rxReport" />/ 发<k-input-rs v-model="args.txReport" /></p>
      <p>
        <k-input-time v-model="args.time" v-model:timezone="args.timezone" />
      </p>
      <p>
        FREQ: <k-input-freq v-model="args.frequency" /> MODE: <k-input-mode v-model="args.mode" />
      </p>
      <p>摘要：<input type="text" name="summary" v-model="args.summary" /></p>
      <p><button type="submit">提交</button></p>
    </form>
  </div>
</template>
<script setup lang="ts">
import KInputTime from '@/components/input/KInputTime.vue';
import KInputRs from '@/components/input/KInputRs.vue';
import KInputMode from '@/components/input/KInputMode.vue';
import KInputFreq from '@/components/input/KInputFreq.vue';
import KInputCallsign from '@/components/input/KInputCallsign.vue';
import { getCurrentTimeTagString, getLocalTimeZoneOffsetHours } from '@util/time';
import { type CreateCommunicationLogInput, newCommunicationLog } from '@/api/update';
import { defaultValue } from '@/config';
import { DateTimeTagField, getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({
  callsign: { type: 'string' },
  time: new DateTimeTagField(getCurrentTimeTagString()),
  timezone: {
    type: 'number',
    integer: true,
    min: -12,
    max: 14,
    default: getLocalTimeZoneOffsetHours(),
  },
  rxReport: { type: 'number', integer: true, min: 11, max: 99, default: 59 },
  txReport: { type: 'number', integer: true, min: 11, max: 99, default: 59 },
  frequency: { type: 'number', default: defaultValue.newLog.frequency },
  mode: { type: 'choice', values: ['FM', 'AM', 'CW'], default: defaultValue.newLog.mode },
  summary: { type: 'string' },
});

const submitForm = () => {
  const options: CreateCommunicationLogInput = {
    callsign: args.callsign,
    time: args.time,
    rxReport: args.rxReport,
    txReport: args.txReport,
    summary: args.summary ? args.summary : undefined,
    frequency: args.frequency,
    mode: args.mode,
  };
  newCommunicationLog(options)
    .then(() => {
      alert('提交成功');
    })
    .catch((err) => {
      alert(`提交失败: ${err}`);
    });
};
</script>
<style scoped lang="scss">
.box {
  padding: 1em;
}
</style>
