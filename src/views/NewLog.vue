<template>
  <div class="box">
    <h1>新建日志</h1>
    <form @submit.prevent="submitForm">
      <p>呼号：<input type="text" name="callsign" v-model="callsign" required /></p>
      <p>RS: 收<k-input-rs v-model="rxReport" />/ 发<k-input-rs v-model="txReport" /></p>
      <p>
        <k-input-time v-model="time" />
      </p>
      <p>FREQ: <k-input-freq v-model="freq" /> MODE: <k-input-mode v-model="mode" /></p>
      <p>摘要：<input type="text" name="summary" v-model="summary" /></p>
      <p><button type="submit">提交</button></p>
    </form>
  </div>
</template>
<script setup lang="ts">
import KInputTime from '@/components/input/KInputTime.vue';
import KInputRs from '@/components/input/KInputRs.vue';
import KInputMode from '@/components/input/KInputMode.vue';
import KInputFreq from '@/components/input/KInputFreq.vue';
import { getCurrentTimeTagString } from '@util/time';
import type { RadioMode } from '@/types/data';
import { type CreateCommunicationLogInput, newCommunicationLog } from '@/api/update';

const props = defineProps<{
  callsign?: string;
}>();

const callsign = ref(props.callsign ?? '');
const time = ref(getCurrentTimeTagString());
const rxReport = ref(59);
const txReport = ref(59);
const summary = ref('');
const freq = ref(145.67);
const mode = ref<RadioMode>('FM');

const submitForm = () => {
  const options: CreateCommunicationLogInput = {
    callsign: callsign.value,
    time: time.value,
    rxReport: rxReport.value,
    txReport: txReport.value,
    summary: summary.value ? summary.value : undefined,
    frequency: freq.value,
    mode: mode.value,
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
