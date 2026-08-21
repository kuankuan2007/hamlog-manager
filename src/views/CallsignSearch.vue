<template>
  <div class="box">
    <h1>呼号搜索</h1>
    <input type="text" v-model="searchContent" placeholder="输入呼号进行搜索" />
    <a :href="`/new-log?callsign=${searchContent}`" class="new-log-button" target="_blank"
      >新增通联记录</a
    >
    <div class="result-box">
      <h2>搜索结果</h2>
      <ul class="result-list" v-if="searchResult.length > 0">
        <li v-for="item in searchResult" :key="item.callsign">
          <h3 class="callsign-data">{{ item.callsign }}</h3>
          <p>
            <a :href="`/callsign/${item.callsign}`" class="detail-button" target="_blank">详情</a>
            <a :href="`/new-log?callsign=${item.callsign}`" class="new-log-button" target="_blank"
              >新增通联记录</a
            >
          </p>
          <table>
            <thead>
              <tr>
                <th>{{ getShowText('callsign') }}</th>
                <th>{{ getShowText('time') }}</th>
                <th>{{ getShowText('frequency') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in item.logs" :key="log.time">
                <td class="callsign-data">{{ log.callsign }}</td>
                <td>{{ log.time }}</td>
                <td>{{ log.frequency }}</td>
              </tr>
            </tbody>
          </table>
        </li>
      </ul>
      <p v-else>暂无搜索结果</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { searchCallsign } from '@/api/select';
import type { CommunicationLogSearchResult } from '@schema/communicationLog';
import getShowText from '@/scripts/showText';

const searchContent = ref('');
const searchResult = ref<CommunicationLogSearchResult[]>([]);

function getTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text)) return NodeFilter.FILTER_SKIP;
      const value = node.nodeValue;
      if (!value) return NodeFilter.FILTER_REJECT;
      if (!value.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  } as NodeFilter);

  const res: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    res.push(current as Text);
    current = walker.nextNode();
  }
  return res;
}
function highlightCallsign(query: string) {
  CSS.highlights.clear();
  if (!query) return;
  const eles = document.querySelectorAll('.callsign-data');

  const textNodes: Text[] = Array.from(eles)
    .map((item) => getTextNodes(item))
    .flat();
  const value = query.toUpperCase();
  const ranges: Range[] = [];
  for (const i of textNodes) {
    const text = i.textContent.toUpperCase();
    const indices: number[] = [];
    let now = 0;
    while (now < text.length) {
      const index = text.indexOf(value, now);
      if (index === -1) break;
      indices.push(index);
      now = index + value.length;
    }
    ranges.push(
      ...indices.map((index) => {
        const range = document.createRange();
        range.setStart(i, index);
        range.setEnd(i, index + value.length);
        return range;
      })
    );
  }
  CSS.highlights.set('search-results', new Highlight(...ranges));
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
