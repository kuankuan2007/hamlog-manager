<template>
  <div class="box">
    <h1>发送邮件</h1>
    <form @submit.prevent="submitSend">
      <p>
        收件人：
        <InputEmailList
          v-model="toList"
          v-model:resolved="toResolved"
          v-model:unresolved="toUnresolved"
          v-model:pending="toPending"
        />
      </p>
      <p>
        抄送：
        <InputEmailList
          v-model="ccList"
          v-model:resolved="ccResolved"
          v-model:unresolved="ccUnresolved"
          v-model:pending="ccPending"
        />
      </p>
      <p>
        密送：
        <InputEmailList
          v-model="bccList"
          v-model:resolved="bccResolved"
          v-model:unresolved="bccUnresolved"
          v-model:pending="bccPending"
        />
      </p>
      <p>标题：<input v-model="subject" type="text" placeholder="邮件标题" required /></p>
      <p>
        格式：
        <select v-model="contentType">
          <option value="text">纯文本</option>
          <option value="html">HTML</option>
        </select>
      </p>
      <p>正文：<textarea v-model="body" rows="12" placeholder="邮件正文" required /></p>
      <p class="hint">
        输入值包含 @ 时按邮箱处理，否则按呼号处理并自动读取缓存邮箱。未命中的呼号会以红色加粗显示。
      </p>
      <p>
        <button type="button" class="secondary" @click="handlePreview">预览</button>
        <button type="submit">发送</button>
      </p>
    </form>

    <div v-if="previewHtml">
      <h2>预览</h2>
      <iframe :srcdoc="previewHtml" title="Email Preview" class="preview-frame" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { previewEmail, sendEmailRequest } from '@/api/email';
import InputEmailList from '@/components/input/InputEmailList.vue';
import type { SendEmailRouteProps } from '@/scripts/sendEmail';
import type { SendEmailInput } from '@schema/email';

const props = defineProps<SendEmailRouteProps>();

const selfCallsign = '<CC_SELF>';

function withDefaultSelfCc(values?: string[]): string[] {
  const nextValues = values ? [...values] : [];
  if (nextValues.some((value) => value.trim().toUpperCase() === selfCallsign)) {
    return nextValues;
  }
  return [selfCallsign, ...nextValues];
}

const toList = ref<string[]>(props.to ? [...props.to] : []);
const ccList = ref<string[]>(withDefaultSelfCc(props.cc));
const bccList = ref<string[]>(props.bcc ? [...props.bcc] : []);
const toResolved = ref<string[]>([]);
const ccResolved = ref<string[]>([]);
const bccResolved = ref<string[]>([]);
const toUnresolved = ref<string[]>([]);
const ccUnresolved = ref<string[]>([]);
const bccUnresolved = ref<string[]>([]);
const toPending = ref(false);
const ccPending = ref(false);
const bccPending = ref(false);
const subject = ref(props.title || '');
const contentType = ref<'text' | 'html'>('text');
const body = ref(props.content || '');
const previewHtml = ref('');

function validateBeforeBuild(): void {
  if (!subject.value.trim()) throw new Error('标题不能为空');
  if (!body.value.trim()) throw new Error('正文不能为空');
  if (toPending.value || ccPending.value || bccPending.value) {
    throw new Error('呼号邮箱仍在查询中，请稍后重试');
  }

  const unresolvedGroups = (
    [
      ['收件人', toUnresolved.value],
      ['抄送', ccUnresolved.value],
      ['密送', bccUnresolved.value],
    ] as [string, string[]][]
  ).filter(([, values]) => values.length > 0);

  if (unresolvedGroups.length > 0) {
    const message = unresolvedGroups
      .map(([label, values]) => `${label}: ${values.join('、')}`)
      .join('；');
    throw new Error(`以下呼号暂无缓存邮箱，请刷新或手动更新：${message}`);
  }

  if (toResolved.value.length === 0) {
    throw new Error('发送前至少需要一个有效收件人');
  }
}

function buildPayload(): SendEmailInput {
  validateBeforeBuild();
  return {
    to: toResolved.value,
    cc: ccResolved.value,
    bcc: bccResolved.value,
    subject: subject.value.trim(),
    body: body.value,
    contentType: contentType.value,
  };
}

async function handlePreview() {
  try {
    const payload = buildPayload();
    const result = await previewEmail(payload);
    previewHtml.value = result.html;
    alert('预览已生成');
  } catch (error) {
    alert(`预览失败: ${error}`);
  }
}

async function submitSend() {
  try {
    const payload = buildPayload();
    await sendEmailRequest(payload);
    alert('邮件已发送');
  } catch (error) {
    alert(`发送失败: ${error}`);
  }
}
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}

.hint {
  max-width: 40rem;
  font-size: 0.9em;
}

textarea {
  width: min(100%, 40rem);
  display: block;
  resize: vertical;
}

.preview-frame {
  width: min(100%, 50rem);
  min-height: 24rem;
  border: 1px solid #ccc;
  background: #fff;
}

button {
  margin-right: 0.5em;
}
</style>
