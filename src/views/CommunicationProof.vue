<template>
  <div class="proof-page">
    <div class="screen-controls">
      <div class="proof-inputs">
        <div>
          <label>
            对方单位名称
            <input
              class="recipient-input"
              v-model.trim="args.recipientOrganization"
              type="text"
              placeholder="请输入对方单位名称"
            />
          </label>
        </div>

        <div>
          <label>
            称呼
            <select v-model="args.recipientName">
              <option v-for="name in recipientNameList" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
          </label>
        </div>

        <div>
          <button type="button" :disabled="printData.length === 0" @click="printProof">
            打印证明
          </button>
        </div>
      </div>

      <section class="log-picker">
        <h2>选择通联记录</h2>
        <div class="search-control">
          <div class="search-row">
            <label>
              按呼号搜索
              <input v-model.trim="args.search" type="search" placeholder="输入完整或部分呼号" />
            </label>
          </div>
          <div v-if="hasSearched" ref="searchPopover" class="search-popover">
            <p v-if="searchError" class="error">{{ searchError }}</p>
            <ul v-if="searchResults.length" class="search-results">
              <li v-for="result in searchResults" :key="result.callsign">
                <div class="callsign-heading">
                  <strong class="callsign-data">{{ result.callsign }}</strong>
                  <span
                    >{{
                      logsByCallsign[result.callsign]?.length ?? result.logs.length
                    }}
                    条记录</span
                  >
                </div>
                <ul v-if="logsByCallsign[result.callsign]?.length" class="log-options">
                  <li
                    v-for="record in logsByCallsign[result.callsign].slice(0, 3)"
                    :key="record.id"
                  >
                    <label>
                      <input
                        type="checkbox"
                        :checked="isSelected(record.id)"
                        @change="toggleRecord(record)"
                      />
                      <span>
                        {{ record.time }} · {{ record.frequency.toFixed(3) }} MHz ·
                        {{ record.mode }} · {{ record.rxReport }}/{{ record.txReport }}
                      </span>
                    </label>
                  </li>
                </ul>
                <details
                  v-if="(logsByCallsign[result.callsign]?.length ?? 0) > 3"
                  class="more-logs"
                >
                  <summary>
                    展开其余 {{ logsByCallsign[result.callsign].length - 3 }} 条记录
                  </summary>
                  <ul class="log-options">
                    <li v-for="record in logsByCallsign[result.callsign].slice(3)" :key="record.id">
                      <label>
                        <input
                          type="checkbox"
                          :checked="isSelected(record.id)"
                          @change="toggleRecord(record)"
                        />
                        <span>
                          {{ record.time }} · {{ record.frequency.toFixed(3) }} MHz ·
                          {{ record.mode }} · {{ record.rxReport }}/{{ record.txReport }}
                        </span>
                      </label>
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
            <p v-else-if="!searchLoading && !searchError">没有匹配的呼号。</p>
          </div>
        </div>

        <section v-if="printData.length" class="selected-logs">
          <h3>已选 {{ printData.length }} 条</h3>
          <ul>
            <li v-for="record in printData" :key="record.id">
              <span
                >{{ record.callsign }} · {{ record.time }} ·
                {{ record.frequency.toFixed(3) }} MHz</span
              >
              <button type="button" @click="removeRecord(record.id)">移除</button>
            </li>
          </ul>
        </section>
        <p v-if="error" class="error">{{ error }}</p>
      </section>
    </div>

    <article class="document">
      <header class="header">
        <div class="header-content">中华人民共和国业余无线电台 {{ selfInfoData.callsign }}</div>
        <hr />
      </header>
      <h1>通联证明</h1>
      <p class="recipient">致{{ args.recipientOrganization }}：</p>
      <div class="proof-content">
        <p class="content">
          兹证明，本台（呼号：{{ selfInfoData.callsign }}）与{{
            args.recipientName
          }}相关业余无线电台的通联记录如下：
        </p>

        <table v-if="printData.length > 0">
          <thead>
            <tr>
              <th rowspan="2">序号</th>
              <th rowspan="2">通联时间（UTC）</th>
              <th rowspan="2">对方呼号</th>
              <th rowspan="2">频率（MHz）</th>
              <th rowspan="2">模式</th>
              <th colspan="2">信号报告</th>
            </tr>
            <tr>
              <th>收</th>
              <th>发</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in printData" :key="record.id">
              <td>{{ index + 1 }}</td>
              <td>{{ record.time }}</td>
              <td>{{ record.callsign }}</td>
              <td>{{ record.frequency.toFixed(3) }}</td>
              <td>{{ record.mode }}</td>
              <td>{{ record.rxReport }}</td>
              <td>{{ record.txReport }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else-if="!error" class="empty">请在页面上方搜索并选择通联记录。</p>
        <p class="content">
          根据《业余无线电台管理办办法》第三十六条之规定，我台将如实记录并保留上述通联记录并保留2年以上，以备查验。
        </p>
        <p class="content">
          我台对与{{
            args.recipientName
          }}的通联表示诚挚的感谢，并期待未来能有更多的合作与交流的机会。
        </p>
        <p class="content">特此证明。</p>
      </div>

      <div class="issuer">
        <p>{{ selfInfoData.communicationProofIssuer }}</p>
        <p>{{ issueDate }}</p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { CommunicationLog, CommunicationLogSearchResult } from '@schema/communicationLog';
import {
  searchCallsign,
  selectCommunicationLogById,
  selectCommunicationLogsByCallsign,
} from '@/api/select';
import { highlight } from '@/scripts/searchHighlight';
import { selfInfoData } from '@/scripts/selfInfo';
import { getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({
  ids: { type: 'array' },
  recipientOrganization: { type: 'string' },
  recipientName: { type: 'choice', values: ['贵单位', '您'], default: '贵单位' },
  search: { type: 'string' },
});
const printData = ref<CommunicationLog[]>([]);
const error = ref('');
const searchResults = ref<CommunicationLogSearchResult[]>([]);
const searchError = ref('');
const searchLoading = ref(false);
const hasSearched = ref(false);
const logsByCallsign = ref<Record<string, CommunicationLog[]>>({});
const searchPopover = useTemplateRef<HTMLDivElement>('searchPopover');

const recipientNameList = ['贵单位', '您'] as const;

let requestVersion = 0;
let searchController: AbortController | undefined;

const now = new Date();
const issueDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

watch(
  () => args.ids.join(','),
  async (value) => {
    const selectedIds = printData.value.map((record) => record.id).join(',');
    if (value === selectedIds) return;

    const currentVersion = ++requestVersion;
    printData.value = [];
    error.value = '';

    if (!value) {
      return;
    }

    const idTexts = value.split(',');
    const ids = idTexts.map(Number);
    if (
      idTexts.some((id) => !/^\d+$/.test(id)) ||
      ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
    ) {
      error.value = '参数 ids 格式无效，请使用正整数 ID 并以英文逗号分隔。';
      return;
    }

    const uniqueIds = [...new Set(ids)];
    try {
      const results = await Promise.all(uniqueIds.map(selectCommunicationLogById));
      if (currentVersion !== requestVersion) return;

      const missingIds = uniqueIds.filter((_, index) => results[index] === null);
      if (missingIds.length > 0) {
        error.value = `未找到通联日志 ID：${missingIds.join(', ')}`;
        return;
      }

      printData.value = results.filter((record): record is CommunicationLog => record !== null);
    } catch (loadError) {
      if (currentVersion !== requestVersion) return;
      error.value = loadError instanceof Error ? loadError.message : String(loadError);
    }
  },
  { immediate: true }
);

async function searchLogs(): Promise<void> {
  const query = args.search.trim();
  searchController?.abort();
  searchController = undefined;
  searchLoading.value = false;
  searchError.value = '';
  hasSearched.value = Boolean(query);
  if (!query) return;

  const controller = new AbortController();
  searchController = controller;
  searchLoading.value = true;
  try {
    const results = await searchCallsign(query, controller);
    if (controller.signal.aborted) return;

    const logs = await Promise.all(
      results.map(
        async ({ callsign }) =>
          [callsign, await selectCommunicationLogsByCallsign(callsign, controller)] as const
      )
    );
    if (controller.signal.aborted) return;
    logsByCallsign.value = Object.fromEntries(logs);
    searchResults.value = results;
  } catch (searchLoadError) {
    if (!controller.signal.aborted) {
      searchError.value =
        searchLoadError instanceof Error ? searchLoadError.message : String(searchLoadError);
    }
  } finally {
    if (searchController === controller) searchLoading.value = false;
  }
}

watch(
  () => args.search,
  () => {
    void searchLogs();
  }
);

function highlightSearchResults(): void {
  const elements = searchPopover.value?.querySelectorAll('.callsign-data') ?? [];
  highlight(args.search, Array.from(elements), 'search-results');
}

onMounted(highlightSearchResults);
onUpdated(highlightSearchResults);

function isSelected(id: number): boolean {
  return args.ids.includes(String(id));
}

function toggleRecord(record: CommunicationLog): void {
  error.value = '';
  if (isSelected(record.id)) {
    removeRecord(record.id);
    return;
  }
  args.ids = [...args.ids, String(record.id)];
}

function removeRecord(id: number): void {
  error.value = '';
  args.ids = args.ids.filter((selectedId) => selectedId !== String(id));
}

function printProof(): void {
  window.print();
}
</script>

<style scoped lang="scss">
@page {
  size: A4;
  margin: 3.7cm 2.6cm 3.5cm 2.8cm;
}

.proof-page {
  padding: 1rem;
}

.screen-controls {
  display: grid;
  gap: 1rem;
  margin: 0 auto 1rem;
  max-width: 21cm;

  label {
    display: grid;
    gap: 0.25rem;
  }

  input[type='text'],
  input[type='search'] {
    width: min(90%, 26rem);
  }

  button {
    padding: 0.25rem 0.5em;
    font-size: 0.8em;
    cursor: pointer;
    white-space: nowrap;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .error {
    margin: 0;
    @include theme.use {
      color: theme.get('strong-color');
    }
  }
}

.proof-inputs,
.search-row {
  display: flex;
  align-items: end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-control {
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.search-popover {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  box-sizing: border-box;
  width: min(34rem, calc(100vw - 2rem));
  max-height: min(60vh, 24rem);
  overflow: auto;
  padding: 0.25rem 0.5rem;
  border: 1px solid;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.35;

  @include theme.use {
    color: theme.get('color');
    background-color: theme.get('background');
    border-color: theme.mix('color', 'background', 50%);
    box-shadow: 0 0.25rem 0.75rem theme.mix('color', 'background', 50%, 18%);
  }

  > p {
    margin: 0.25rem 0;
  }
}

.search-control:has(input[type='search']:focus) .search-popover,
.search-control:has(input[type='search']:active) .search-popover,
.search-popover:focus-within,
.search-popover:hover {
  display: block;
}

.search-popover *::highlight(search-results) {
  @include theme.use {
    color: theme.get('strong-color');
  }
}

.log-picker {
  padding-top: 0.75rem;
  border-top: 1px solid;

  @include theme.use {
    border-color: theme.mix('color', 'background', 50%);
  }

  h2,
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }
}

.search-results,
.log-options,
.selected-logs ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}

.search-popover .search-results {
  margin-top: 0;
}

.search-results > li {
  padding: 0.2rem 0;
  border-bottom: 1px solid;

  @include theme.use {
    border-color: theme.mix('color', 'background', 50%);
  }
}

.search-results > li:last-child {
  border-bottom: none;
}

.callsign-heading {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  padding: 0.125rem 0;
}

.log-options {
  padding-left: 0.75rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.125rem 0;
  }
}

.more-logs {
  summary {
    padding: 0.125rem 0;
    cursor: pointer;
  }
}

.selected-logs {
  margin-top: 1rem;

  li {
    display: flex;
    margin: 0.25rem 0;
    align-items: center;
    justify-content: space-between;
  }
}

.document {
  box-sizing: border-box;
  width: 21cm;
  min-height: 29.7cm;
  max-width: 100%;
  margin: 0 auto;
  padding: 3.7cm 2.6cm 3.5cm 2.8cm;
  border: 1px solid;
  font-family: '仿宋_GB2312', 'FangSong', '仿宋', serif;
  font-size: 16pt;
  line-height: 28pt;

  @include theme.use {
    color: theme.get('color');
    border-color: theme.get('color');
  }
  .header {
    .header-content {
      text-align: center;
      font-family: '方正小标宋简体', 'FZXiaoBiaoSong-B05S', '华文中宋', serif;
      font-size: 1em;
    }
    hr {
      margin: 0.2em 3em;
    }
  }

  h1 {
    margin: 0 0 28pt;
    text-align: center;
    font-family: '方正小标宋简体', 'FZXiaoBiaoSong-B05S', '华文中宋', serif;
    font-size: 22pt;
    font-weight: 400;
    line-height: 1.4;
  }

  p {
    margin: 0;
  }

  .introduction,
  .content {
    text-indent: 2em;
  }
  .proof-content {
    margin-left: 0.8em;
  }
  table {
    width: 100%;
    margin: 14pt 0;
    border-collapse: collapse;
    font-family: '仿宋_GB2312', 'FangSong', '仿宋', serif;
    font-size: 14pt;
    line-height: 1.5;

    th,
    td {
      padding: 5pt 3pt;
      @include theme.use {
        border-color: theme.get('color');
      }
      text-align: center;
      font-weight: 400;
    }

    tr {
      break-inside: avoid;
    }
  }

  .empty {
    text-align: center;
    border: 1px solid;
    @include theme.use {
      border-color: theme.get('strong-color');
      color: theme.get('strong-color');
    }
  }

  .closing {
    margin-top: 18pt;
  }

  .issuer {
    margin-top: 4em;
    margin-right: 1em;
    text-align: right;
  }
}

@media print {
  .proof-page {
    padding: 0;
  }

  .screen-controls {
    display: none;
  }

  .document {
    width: unset;
    min-height: 0;
    max-width: none;
    height: unset;
    margin: 0;
    padding: 0;
    border: none;
  }
}

@media screen and (max-width: 600px) {
  .document {
    min-height: 0;
    padding: 2rem 1.25rem;
  }

  .selected-logs li {
    align-items: flex-start;
  }
}
</style>
