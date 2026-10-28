<template>
  <div class="box">
    <h1>确认 QSL 发件记录</h1>
    <p v-if="loading">正在加载记录……</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <form v-else-if="record" @submit.prevent="submitForm">
      <p>记录 ID：{{ record.id }}</p>
      <p>呼号：{{ record.callsign }}</p>
      <p>发送日期：{{ record.sentAt }}</p>
      <p>
        邮件状态：
        <select v-model="args.status" name="status" required>
          <option value="received">已收到</option>
          <option value="returned">已退回</option>
          <option value="not_received">未收到</option>
        </select>
      </p>
      <p>
        确认日期：
        <input v-model="args.confirmedAt" type="date" name="confirmedAt" required />
      </p>
      <p>
        <button type="submit" :disabled="submitting">
          {{ submitting ? '提交中' : '确认' }}
        </button>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { selectQSLSendById } from '@/api/select';
import { confirmQSLSend, type ConfirmQSLSendInput } from '@/api/update';
import type { QSLSend } from '@schema/qsl';
import { getCurrentTimeTagString } from '@util/time';
import { DateTagField, getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({
  id: { type: 'number', integer: true, min: 1 },
  status: { type: 'choice', values: ['received', 'returned', 'not_received'] },
  confirmedAt: new DateTagField(),
});

const record = ref<QSLSend | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const submitting = ref(false);

async function submitForm() {
  if (record.value === null || !args.status) return;
  const options: ConfirmQSLSendInput = {
    id: record.value.id,
    confirmedAt: args.confirmedAt,
    status: args.status,
  };

  submitting.value = true;
  try {
    await confirmQSLSend(options);
    alert('确认成功');
  } catch (error) {
    alert(`确认失败: ${error}`);
  } finally {
    submitting.value = false;
  }
}

async function loadRecord() {
  if (!Number.isSafeInteger(args.id) || args.id <= 0) {
    error.value = '缺少有效的 QSL 发件记录 ID';
    record.value = null;
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    record.value = await selectQSLSendById(args.id);
    if (record.value === null) {
      error.value = `未找到 ID 为 ${args.id} 的 QSL 发件记录`;
      return;
    }
    if (!args.status) args.status = record.value.status ?? 'received';
    if (!args.confirmedAt) {
      args.confirmedAt = record.value.confirmedAt ?? getCurrentTimeTagString().slice(0, 10);
    }
  } catch (reason) {
    error.value = `加载失败：${reason instanceof Error ? reason.message : String(reason)}`;
  } finally {
    loading.value = false;
  }
}

watch(
  () => args.id,
  () => void loadRecord(),
  { immediate: true }
);
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}
</style>
