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
        <select v-model="status" name="status" required>
          <option value="received">已收到</option>
          <option value="returned">已退回</option>
        </select>
      </p>
      <p>
        确认日期：
        <input v-model="confirmedAt" type="date" name="confirmedAt" required />
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
import type { QSLSend, QSLSendStatus } from '@schema/qsl';
import { getCurrentTimeTagString } from '@util/time';

const props = defineProps<{
  id?: number;
}>();

const record = ref<QSLSend | null>(null);
const status = ref<QSLSendStatus>('received');
const confirmedAt = ref(getCurrentTimeTagString().slice(0, 10));
const loading = ref(false);
const error = ref<string | null>(null);
const submitting = ref(false);

async function submitForm() {
  if (record.value === null) return;
  const options: ConfirmQSLSendInput = {
    id: record.value.id,
    confirmedAt: confirmedAt.value,
    status: status.value,
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
  if (props.id === undefined) {
    error.value = '缺少有效的 QSL 发件记录 ID';
    return;
  }

  loading.value = true;
  try {
    record.value = await selectQSLSendById(props.id);
    if (record.value === null) {
      error.value = `未找到 ID 为 ${props.id} 的 QSL 发件记录`;
      return;
    }
    status.value = record.value.status ?? 'received';
    confirmedAt.value = record.value.confirmedAt ?? confirmedAt.value;
  } catch (reason) {
    error.value = `加载失败：${reason instanceof Error ? reason.message : String(reason)}`;
  } finally {
    loading.value = false;
  }
}

loadRecord();
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}
</style>
