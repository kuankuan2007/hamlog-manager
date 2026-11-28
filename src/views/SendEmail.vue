<template>
  <div class="box">
    <h1>发送邮件</h1>
    <p v-if="draftError" role="alert">{{ draftError }}</p>
    <p v-if="!draftReady && !draftError">正在加载邮件草稿...</p>
    <form v-if="draftReady" @submit.prevent="submitSend">
      <p>
        收件人：
        <InputEmailList
          v-model="args.to"
          v-model:input-value="args.toInput"
          v-model:resolved="toResolved"
          v-model:unresolved="toUnresolved"
          v-model:pending="toPending"
        />
      </p>
      <p>
        抄送：
        <InputEmailList
          v-model="args.cc"
          v-model:input-value="args.ccInput"
          v-model:resolved="ccResolved"
          v-model:unresolved="ccUnresolved"
          v-model:pending="ccPending"
        />
      </p>
      <p>
        密送：
        <InputEmailList
          v-model="args.bcc"
          v-model:input-value="args.bccInput"
          v-model:resolved="bccResolved"
          v-model:unresolved="bccUnresolved"
          v-model:pending="bccPending"
        />
      </p>
      <p>标题：<input v-model="args.title" type="text" placeholder="邮件标题" required /></p>
      <p>
        格式：
        <select v-model="args.contentType">
          <option value="text">纯文本</option>
          <option value="html">HTML</option>
        </select>
      </p>
      <p>正文：<textarea v-model="args.content" rows="12" placeholder="邮件正文" required /></p>
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
import type { SendEmailInput } from '@schema/email';
import { defaultValue } from '@/config';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';
import {
  createEmailContentId,
  normalizeEmailRecipients,
  readEmailDraft,
  requestEmailDraft,
  saveEmailDraft,
  type EmailDraft,
  type SendEmailLinkOptions,
} from '@/scripts/sendEmail';

const route = useRoute();
const router = useRouter();
const draftReady = ref(false);
const draftError = ref('');
const args = reactive<EmailDraft>({
  title: '',
  content: '',
  to: [],
  toInput: '',
  cc: [],
  ccInput: '',
  bcc: [],
  bccInput: '',
  contentType: 'text',
});
let contentId = '';
let loadVersion = 0;
onScopeDispose(() => {
  loadVersion++;
});

function addDefaultCc(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of ['<CC_SELF>', ...defaultValue.sendEmail.cc, ...values]) {
    const key = value.trim().toUpperCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(value.trim());
    }
  }
  return result;
}

function draftFromLink(options: SendEmailLinkOptions): EmailDraft {
  return {
    title: options.title,
    content: options.content,
    to: normalizeEmailRecipients(options.to),
    toInput: '',
    cc: normalizeEmailRecipients(options.cc),
    ccInput: '',
    bcc:
      options.bcc === undefined
        ? [...defaultValue.sendEmail.bcc]
        : normalizeEmailRecipients(options.bcc),
    bccInput: '',
    contentType: 'text',
  };
}

const legacyKeys = [
  'title',
  'content',
  'to',
  'toInput',
  'cc',
  'ccInput',
  'bcc',
  'bccInput',
  'contentType',
];

async function loadDraft(): Promise<void> {
  if (route.path !== '/send-email') return;
  const params = new URL(route.fullPath, window.location.origin).searchParams;
  const requestedId = params.get('email-content-id') || createEmailContentId();
  if (requestedId === contentId) return;
  const version = ++loadVersion;
  contentId = requestedId;
  draftReady.value = false;
  draftError.value = '';
  const hasLegacy = legacyKeys.some((key) => params.has(key));
  const legacy: EmailDraft | undefined = hasLegacy
    ? {
        title: params.get('title') ?? '',
        content: params.get('content') ?? '',
        to: normalizeEmailRecipients(params.getAll('to')),
        toInput: params.get('toInput') ?? '',
        cc: normalizeEmailRecipients(params.getAll('cc')),
        ccInput: params.get('ccInput') ?? '',
        bcc: params.has('bcc')
          ? normalizeEmailRecipients(params.getAll('bcc'))
          : [...defaultValue.sendEmail.bcc],
        bccInput: params.get('bccInput') ?? '',
        contentType: params.get('contentType') === 'html' ? 'html' : 'text',
      }
    : undefined;

  const query: LocationQueryRaw = { ...route.query, 'email-content-id': requestedId };
  for (const key of legacyKeys) delete query[key];
  const hash = route.hash;
  queueMicrotask(() => {
    if (version === loadVersion && route.path === '/send-email')
      void router.replace({ query, hash });
  });

  try {
    let draft = readEmailDraft(requestedId) ?? legacy;
    if (!draft && params.has('email-content-id')) {
      const shared = await requestEmailDraft(requestedId);
      if (version !== loadVersion || route.path !== '/send-email') return;
      if (!shared) throw new Error('未找到邮件草稿，请从原页面重新打开。');
      draft = draftFromLink(shared);
    }
    draft ??= draftFromLink({ title: '', content: '' });
    Object.assign(args, draft, { cc: addDefaultCc(draft.cc) });
    saveEmailDraft(requestedId, args);
    draftReady.value = true;
  } catch (reason) {
    if (version === loadVersion)
      draftError.value = reason instanceof Error ? reason.message : String(reason);
  }
}

watch(
  () => route.fullPath,
  () => void loadDraft(),
  { immediate: true, flush: 'sync' }
);
watch(
  args,
  () => {
    if (!draftReady.value) return;
    try {
      saveEmailDraft(contentId, args);
      draftError.value = '';
    } catch (reason) {
      draftError.value = `无法保存邮件草稿：${reason instanceof Error ? reason.message : String(reason)}`;
    }
  },
  { deep: true }
);
const toResolved = ref<string[]>([]);
const ccResolved = ref<string[]>([]);
const bccResolved = ref<string[]>([]);
const toUnresolved = ref<string[]>([]);
const ccUnresolved = ref<string[]>([]);
const bccUnresolved = ref<string[]>([]);
const toPending = ref(false);
const ccPending = ref(false);
const bccPending = ref(false);
const previewHtml = ref('');

function validateBeforeBuild(): void {
  if (!args.title.trim()) throw new Error('标题不能为空');
  if (!args.content.trim()) throw new Error('正文不能为空');
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
    subject: args.title.trim(),
    body: args.content,
    contentType: args.contentType,
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
