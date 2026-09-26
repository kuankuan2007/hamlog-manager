<template>
  <div class="box">
    <h1>呼号搜索</h1>
    <p class="search-box">
      <KInputCallsign v-model="searchContent" placeholder="输入呼号进行搜索" :enable-search="false" />
      <a :href="`/new-log?callsign=${searchContent}`" class="new-log-button" target="_blank"
        >新增通联记录</a
      >
    </p>
    <div class="result-box">
      <h2>搜索结果</h2>
      <ul class="result-list" v-if="searchResult.length > 0" ref="resultListEle">
        <li v-for="item in searchResult" :key="item.callsign">
          <h3 class="callsign-data">{{ item.callsign }}</h3>
          <p>
            <a :href="`/callsign/${item.callsign}`" class="detail-button" target="_blank">详情</a>
            <a :href="`/new-log?callsign=${item.callsign}`" class="new-log-button" target="_blank"
              >新增通联记录</a
            >
          </p>
          <CommunicationLogBasicTable :records="item.logs" time-field="time">
            <template #callsign="{ record }">
              <span class="callsign-data">{{ record.callsign }}</span>
            </template>
          </CommunicationLogBasicTable>
        </li>
      </ul>
      <p v-else>暂无搜索结果</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { searchCallsign } from '@/api/select';
import CommunicationLogBasicTable from '@/components/dataDisplay/CommunicationLogBasicTable.vue';
import KInputCallsign from '@/components/input/KInputCallsign.vue';
import { highlight } from '@/scripts/searchHighlight';
import type { CommunicationLogSearchResult } from '@schema/communicationLog';

const searchContent = ref('');
const searchResult = ref<CommunicationLogSearchResult[]>([]);
const resultListEle=useTemplateRef<HTMLUListElement>('resultListEle');
function highlightCallsign(callsign: string) {
  const elements = resultListEle.value?.querySelectorAll('.callsign-data') || [];
  highlight(callsign, Array.from(elements), 'search-results');
}

let abortController: AbortController | null = null;

function updateSearchResult(query: string) {
  abortController?.abort();
  abortController = new AbortController();
  searchCallsign(query, abortController).then((res) => {
    if (searchContent.value === query) {
      searchResult.value = res;
    }
  });
}
watch(searchContent, async (newVal) => {
  if (newVal) {
    updateSearchResult(newVal);
  }
});
onMounted(() => {
  highlightCallsign(searchContent.value);
});
onUpdated(() => {
  highlightCallsign(searchContent.value);
});
</script>
<style scoped lang="scss">
.search-box {
  display: flex;
  align-items: center;
}
.box {
  padding: 1em;
  a {
    text-decoration: none;
    border: 1px solid;
    padding: 0.1em 0.5em;
    margin-left: 0.5em;
    border-radius: 0.3em;
    @include theme.use {
      background-color: theme.get('background');
      color: theme.get('active-color');
      border-color: theme.get('active-color');
    }
  }
}
.result-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.box *::highlight(search-results) {
  @include theme.use {
    color: theme.get('strong-color');
  }
}
</style>
