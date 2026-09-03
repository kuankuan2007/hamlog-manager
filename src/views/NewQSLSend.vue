<template>
  <div class="box">
    <h1>新增 QSL 发件记录</h1>
    <form @submit.prevent="submitForm">
      <p>呼号：<input v-model="callsign" type="text" name="callsign" required /></p>
      <p>发送日期：<input v-model="sentAt" type="date" name="sentAt" required /></p>
      <p><button type="submit" :disabled="submitting">{{ submitting ? '提交中' : '提交' }}</button></p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { type CreateQSLSendInput, newQSLSend } from '@/api/update';
import { getCurrentTimeTagString } from '@util/time';

const props = defineProps<{
  callsign?: string;
}>();

const callsign = ref(props.callsign ?? '');
const sentAt = ref(getCurrentTimeTagString().slice(0, 10));
const submitting = ref(false);

async function submitForm() {
  const options: CreateQSLSendInput = {
    callsign: callsign.value,
    sentAt: sentAt.value,
  };

  submitting.value = true;
  try {
    await newQSLSend(options);
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
