<template>
  <div class="box">
    <h1>新增 QSL 收件记录</h1>
    <form @submit.prevent="submitForm">
      <p>呼号：<KInputCallsign v-model="args.callsign" required /></p>
      <p>收件日期：<input v-model="args.receivedAt" type="date" name="receivedAt" required /></p>
      <p>
        <button type="submit" :disabled="submitting">{{ submitting ? '提交中' : '提交' }}</button>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { type CreateQSLReceiveInput, newQSLReceive } from '@/api/update';
import KInputCallsign from '@/components/input/KInputCallsign.vue';
import { getCurrentTimeTagString } from '@util/time';
import { DateTagField, getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({
  callsign: { type: 'string' },
  receivedAt: new DateTagField(getCurrentTimeTagString().slice(0, 10)),
});
const submitting = ref(false);

async function submitForm() {
  const options: CreateQSLReceiveInput = {
    callsign: args.callsign,
    receivedAt: args.receivedAt,
  };

  submitting.value = true;
  try {
    await newQSLReceive(options);
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
