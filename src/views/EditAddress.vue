<template>
  <div class="box">
    <h1>{{ pageTitle }}</h1>

    <p v-if="loadError" class="error">加载失败：{{ loadError }}</p>

    <form v-if="callsign" @submit.prevent="submitForm">
      <p>
        呼号：
        <KInputCallsign :model-value="callsign" readonly />
      </p>
      <p>
        邮政编码：
        <input type="text" name="postalCode" required v-model="args.postalCode" />
      </p>
      <p>
        地址：
        <input type="text" name="address" required v-model="args.address" />
      </p>
      <p>
        收件人姓名：
        <input type="text" name="recipientName" v-model="args.recipientName" />
      </p>
      <p>
        <button type="submit" :disabled="submitting || loading">
          {{ submitting ? '提交中' : mode === 'edit' ? '保存修改' : '创建地址' }}
        </button>
      </p>
    </form>

    <p v-else class="error">缺少 callsign 参数，无法编辑地址。</p>
  </div>
</template>

<script setup lang="ts">
import { selectAddressByCallsign } from '@/api/select';
import { type CreateAddressRequest, newAddress } from '@/api/update';
import KInputCallsign from '@/components/input/KInputCallsign.vue';
import { getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({
  callsign: { type: 'string' },
  postalCode: { type: 'string' },
  address: { type: 'string' },
  recipientName: { type: 'string' },
});
const callsign = computed(() => args.callsign.trim());
const loading = ref(false);
const submitting = ref(false);
const loadError = ref<string | null>(null);
const mode = ref<'edit' | 'create'>('edit');

const pageTitle = computed(() => {
  if (mode.value === 'edit') return '编辑地址';
  return '编辑地址（未找到，按新建处理）';
});

async function loadAddress(): Promise<void> {
  if (!callsign.value) return;

  loading.value = true;
  loadError.value = null;
  try {
    const result = await selectAddressByCallsign(callsign.value);
    if (result === null) {
      mode.value = 'create';
      return;
    }

    mode.value = 'edit';
    if (!args.postalCode) args.postalCode = result.postalCode;
    if (!args.address) args.address = result.address;
    if (!args.recipientName) args.recipientName = result.recipientName ?? '';
  } catch (reason) {
    loadError.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

async function submitForm(): Promise<void> {
  if (!callsign.value) return;

  const options: CreateAddressRequest = {
    callsign: callsign.value,
    postalCode: args.postalCode.trim(),
    address: args.address.trim(),
    recipientName: args.recipientName.trim() || undefined,
  };

  submitting.value = true;
  try {
    await newAddress(options);
    mode.value = 'edit';
    alert('提交成功');
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);
    alert(`提交失败: ${message}`);
  } finally {
    submitting.value = false;
  }
}

watch(callsign, () => void loadAddress(), { immediate: true });
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}
</style>
