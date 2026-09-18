<template>
  <div class="input-list">
    <ul v-if="modelValue.length">
      <li v-for="(item, index) in modelValue" :key="`${item}-${index}`" :class="getItemClass(item)">
        <div class="item-text">
          <span class="item-value">{{ item }}</span>
          <span
            class="item-meta"
            :class="{ unresolved: isCallsign(item) ? isUnresolved(item) : isUnknownEmail(item) }"
          >
            <template v-if="isCallsign(item)">
              <template v-if="getLookupState(item)?.loading">查询中</template>
              <template v-else-if="getLookupState(item)?.email">{{
                getLookupState(item)?.email
              }}</template>
              <template v-else>未找到缓存邮箱</template>
              <template v-if="getLookupState(item)?.label">
                （{{ getLookupState(item)?.label }}）
              </template>
            </template>
            <template v-else>
              <template v-if="getEmailLookupState(item)?.loading">查询中</template>
              <template v-else-if="getEmailLookupState(item)?.callsign">{{
                getEmailLookupState(item)?.callsign
              }}</template>
              <template v-else>未知</template>
              <template v-if="getEmailLookupState(item)?.label">
                （{{ getEmailLookupState(item)?.label }}）
              </template>
            </template>
          </span>
        </div>
        <div v-if="isCallsign(item)" class="item-actions">
          <button
            type="button"
            class="item-button"
            :disabled="getLookupState(item)?.loading"
            @click="refreshCallsign(item)"
          >
            刷新
          </button>
          <a
            class="item-link"
            :href="manualEmailHref(item)"
            target="_blank"
            rel="noopener noreferrer"
          >
            手动更新
          </a>
        </div>
        <div v-else-if="isUnknownEmail(item)" class="item-actions">
          <a
            class="item-link"
            :href="manualEmailHrefByEmail(item)"
            target="_blank"
            rel="noopener noreferrer"
          >
            手动更新
          </a>
        </div>
        <button class="remove-button" type="button" @click="removeItem(index)">✖</button>
      </li>
    </ul>
    <input type="text" v-model="inputValue" :placeholder="placeholder" @keydown="handleKeydown" />
  </div>
</template>

<script setup lang="ts">
import { callsign2email } from '@/api/auto';
import type { Callsign2EmailResponse } from '@/api/schema';
import { selectCallsignByEmail } from '@/api/select';

type CallsignLookupState = {
  email: string | null;
  label: string;
  loading: boolean;
  loaded: boolean;
};

type EmailLookupState = {
  callsign: string | null;
  label: string;
  loading: boolean;
  loaded: boolean;
};

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: '输入邮箱地址或呼号，按 Enter 添加',
  }
);

const modelValue = defineModel<string[]>({
  default: () => [],
});
const resolvedModel = defineModel<string[]>('resolved', {
  default: () => [],
});
const unresolvedModel = defineModel<string[]>('unresolved', {
  default: () => [],
});
const pendingModel = defineModel<boolean>('pending', {
  default: false,
});

const inputValue = ref('');
const lookupByCallsign = reactive<Record<string, CallsignLookupState>>({});
const lookupByEmail = reactive<Record<string, EmailLookupState>>({});

function normalizeValue(value: string): string {
  return value.trim();
}

function isEmailValue(value: string): boolean {
  return value.includes('@');
}

function normalizeEmailKey(email: string): string {
  return normalizeValue(email).toLowerCase();
}

function isCallsign(value: string): boolean {
  return !isEmailValue(normalizeValue(value));
}

function getLookupLabel(response: Callsign2EmailResponse): string {
  if (response.realtime) return '实时';
  if (response.comeFrom === 'manual') return '手动';
  return response.lastUpdate ?? '缓存';
}

function ensureLookupState(callsign: string): CallsignLookupState {
  const key = normalizeValue(callsign);
  if (!lookupByCallsign[key]) {
    lookupByCallsign[key] = {
      email: null,
      label: '缓存',
      loading: false,
      loaded: false,
    };
  }
  return lookupByCallsign[key];
}

function getLookupState(value: string): CallsignLookupState | undefined {
  return lookupByCallsign[normalizeValue(value)];
}

function ensureEmailLookupState(email: string): EmailLookupState {
  const key = normalizeEmailKey(email);
  if (!lookupByEmail[key]) {
    lookupByEmail[key] = {
      callsign: null,
      label: '缓存',
      loading: false,
      loaded: false,
    };
  }
  return lookupByEmail[key];
}

function getEmailLookupState(value: string): EmailLookupState | undefined {
  return lookupByEmail[normalizeEmailKey(value)];
}

function isUnresolved(value: string): boolean {
  if (!isCallsign(value)) return false;
  const state = getLookupState(value);
  return !!state && state.loaded && !state.loading && !state.email;
}

function isUnknownEmail(value: string): boolean {
  if (isCallsign(value)) return false;
  const state = getEmailLookupState(value);
  return !!state && state.loaded && !state.loading && !state.callsign;
}

function manualEmailHref(value: string): string {
  return `/manual-email?callsign=${encodeURIComponent(normalizeValue(value))}`;
}

function manualEmailHrefByEmail(value: string): string {
  return `/manual-email?email=${encodeURIComponent(normalizeValue(value))}`;
}

function removeItem(index: number): void {
  modelValue.value.splice(index, 1);
}

function getItemClass(value: string): string[] {
  const classes = ['item'];
  if (isCallsign(value)) classes.push('callsign-item');
  if (isUnresolved(value) || isUnknownEmail(value)) classes.push('unresolved-item');
  return classes;
}

function getResolvedEmailKey(value: string): string | null {
  const normalizedValue = normalizeValue(value);
  if (!normalizedValue) return null;
  if (isEmailValue(normalizedValue)) return normalizeEmailKey(normalizedValue);

  const resolvedEmail = getLookupState(normalizedValue)?.email;
  return resolvedEmail ? normalizeEmailKey(resolvedEmail) : null;
}

function dedupeValuesByEmail(values: string[]): string[] {
  const nextValues: string[] = [];
  const seenEmails = new Set<string>();
  const seenRawValues = new Set<string>();

  for (const rawValue of values) {
    const normalizedValue = normalizeValue(rawValue);
    if (!normalizedValue) continue;

    const resolvedEmailKey = getResolvedEmailKey(normalizedValue);
    if (resolvedEmailKey !== null) {
      if (seenEmails.has(resolvedEmailKey)) continue;
      seenEmails.add(resolvedEmailKey);
      nextValues.push(normalizedValue);
      continue;
    }

    const rawKey = normalizedValue.toLowerCase();
    if (seenRawValues.has(rawKey)) continue;
    seenRawValues.add(rawKey);
    nextValues.push(normalizedValue);
  }

  return nextValues;
}

function syncModelValueDeduped(): void {
  const dedupedValues = dedupeValuesByEmail(modelValue.value);
  if (
    dedupedValues.length === modelValue.value.length &&
    dedupedValues.every((value, index) => value === modelValue.value[index])
  ) {
    return;
  }

  modelValue.value = dedupedValues;
}

function syncModels(): void {
  syncModelValueDeduped();
  const resolved: string[] = [];
  const unresolved: string[] = [];
  const seenResolvedEmails = new Set<string>();

  for (const rawValue of modelValue.value) {
    const value = normalizeValue(rawValue);
    if (!value) continue;

    if (isEmailValue(value)) {
      const emailKey = normalizeEmailKey(value);
      if (seenResolvedEmails.has(emailKey)) continue;
      seenResolvedEmails.add(emailKey);
      resolved.push(value);
      continue;
    }

    const state = getLookupState(value);
    if (state?.email) {
      const emailKey = normalizeEmailKey(state.email);
      if (seenResolvedEmails.has(emailKey)) continue;
      seenResolvedEmails.add(emailKey);
      resolved.push(state.email);
      continue;
    }

    unresolved.push(value);
  }

  resolvedModel.value = resolved;
  unresolvedModel.value = unresolved;
  pendingModel.value = Object.values(lookupByCallsign).some((state) => state.loading);
}

async function resolveCallsign(value: string, forceRefresh: boolean): Promise<void> {
  const callsign = normalizeValue(value);
  if (!callsign || isEmailValue(callsign)) return;

  const state = ensureLookupState(callsign);
  if (state.loading) return;

  state.loading = true;
  syncModels();
  try {
    const response = await callsign2email(callsign, forceRefresh ? 'fallback' : 'cache');
    state.email = response.email;
    state.label = getLookupLabel(response);
    state.loaded = true;
  } catch {
    state.email = null;
    state.label = forceRefresh ? '刷新失败' : '缓存';
    state.loaded = true;
  } finally {
    state.loading = false;
    syncModels();
  }
}

async function refreshCallsign(value: string): Promise<void> {
  await resolveCallsign(value, true);
}

async function resolveEmail(value: string): Promise<void> {
  const email = normalizeValue(value);
  if (!email || !isEmailValue(email)) return;

  const state = ensureEmailLookupState(email);
  if (state.loading) return;

  state.loading = true;
  try {
    const response = await selectCallsignByEmail(email);
    state.callsign = response.callsign;
    state.label = response.lastUpdate ?? response.comeFrom ?? '缓存';
    state.loaded = true;
  } catch {
    state.callsign = null;
    state.label = '查询失败';
    state.loaded = true;
  } finally {
    state.loading = false;
  }
}

async function syncCallsignLookups(values: string[]): Promise<void> {
  const callsigns = [
    ...new Set(values.map(normalizeValue).filter((value) => value && !isEmailValue(value))),
  ];
  const emails = [
    ...new Set(values.map(normalizeValue).filter((value) => value && isEmailValue(value))),
  ];

  for (const key of Object.keys(lookupByCallsign)) {
    if (!callsigns.includes(key)) delete lookupByCallsign[key];
  }
  for (const key of Object.keys(lookupByEmail)) {
    if (!emails.some((email) => normalizeEmailKey(email) === key)) delete lookupByEmail[key];
  }

  syncModels();

  await Promise.all([
    ...callsigns.map(async (callsign) => {
      const state = ensureLookupState(callsign);
      if (state.loaded || state.loading) return;
      await resolveCallsign(callsign, false);
    }),
    ...emails.map(async (email) => {
      const state = ensureEmailLookupState(email);
      if (state.loaded || state.loading) return;
      await resolveEmail(email);
    }),
  ]);

  syncModels();
}

function addInputValue(): void {
  const value = normalizeValue(inputValue.value);
  if (!value) return;
  modelValue.value.push(value);
  inputValue.value = '';
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    addInputValue();
  }
  if (event.key === 'Backspace' && inputValue.value === '') {
    modelValue.value.pop();
  }
}

watch(
  modelValue,
  (value) => {
    syncModelValueDeduped();
    void syncCallsignLookups(value);
  },
  { immediate: true, deep: true }
);
</script>

<style scoped lang="scss">
.input-list {
  padding: 0.5em;

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    padding: 0;
    margin: 0;
  }

  input {
    width: min(100%, 28rem);
    margin-top: 0.5em;
    outline: none;
    font-size: 1em;
  }
}

.item {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  list-style: none;
  padding: 0.35em 0.5em;
  border: 1px solid;
  border-radius: 0.2em;

  @include theme.use {
    border-color: theme.mix('color', 'background', 50%);
  }
}

.item-text {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
}

.item-value {
  line-height: 1.2;
}

.item-meta {
  font-size: 0.85em;
  opacity: 0.8;
}

.item-meta.unresolved,
.unresolved-item .item-value {
  color: #c62828;
  font-weight: 700;
  opacity: 1;
}

.item-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
}

.item-button,
.item-link,
.remove-button {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85em;
}

.remove-button {
  color: #c62828;
}

.item-button:disabled {
  cursor: default;
  opacity: 0.6;
}
</style>
