<template>
  <KInputSearch
    type="text"
    name="callsign"
    v-model="inputValue"
    v-bind="$attrs"
    :searchResult="searchResult"
    autocomplete="off"
  >
    <template #searchResultItem="{ item }">
      <div class="search-result-item">
        <div class="search-result-callsign k-input-search-highlight">{{ item.value }}</div>
        <div class="search-result-contact-count">{{ item.contactCount }}次</div>
        <div class="search-result-last-contact-time">{{ item.lastContactTime }}</div>
      </div>
    </template>
  </KInputSearch>
</template>
<script setup lang="ts">
import KInputSearch from './KInputSearch.vue';
import { tryToGetRelativeTimeString } from '@util/time.ts';
import { searchCallsign } from '@/api/select.ts';
const modelValue = defineModel<string>('modelValue', { default: '' });
const inputValue = computed({
  get: () => modelValue.value,
  set: (value: string) => {
    modelValue.value = value.trim().toUpperCase();
  },
});
const searchResult = ref<{ value: string; contactCount: number; lastContactTime: string }[]>([]);
watch(
  () => inputValue.value,
  (newVal) => {
    updateSearchResult(newVal);
  }
);
let abortController: AbortController | null = null;

function updateSearchResult(query: string) {
  abortController?.abort();
  abortController = new AbortController();
  searchCallsign(query, abortController).then((res) => {
    if (inputValue.value === query) {
      searchResult.value = res.map((resultItem) => ({
        value: resultItem.callsign,
        contactCount: resultItem.logs.length,
        lastContactTime: tryToGetRelativeTimeString(resultItem.logs.toSorted((i) => i.time as unknown as number)[0].time),
      }));
    }
  });
}
</script>
<style scoped lang="scss">
.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.5em;
  .search-result-callsign {
    font-weight: bold;
  }
  .search-result-contact-count {
    font-size: 0.8em;
    opacity: 0.5;
  }
  .search-result-last-contact-time {
    font-size: 0.8em;
    opacity: 0.5;
  }
}
.search-result-item *::highlight(search-results) {
  color: yellow;
}
</style>
