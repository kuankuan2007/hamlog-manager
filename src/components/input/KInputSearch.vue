<template>
  <div class="input-search" @keydown="handleKeyDown" ref="boxEle">
    <input class="input-search-input" type="text" v-model="modelValue" v-bind="$attrs" />
    <div
      class="input-search-result-box"
      v-if="props.enableSearch && props.searchResult && props.searchResult.length > 0"
    >
      <div
        class="input-search-result-item"
        v-for="(item, index) in props.searchResult"
        :key="String(item)"
        :class="{ active: activeIndex === index }"
        @click="confirmIndex(index)"
      >
        <slot name="searchResultItem" :item="item" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" generic="T extends { value: string }">
import { highlight } from '@/scripts/searchHighlight.ts';

const modelValue = defineModel<string>();
const props = withDefaults(defineProps<{ searchResult?: T[]; enableSearch?: boolean; enableHighlight?: boolean }>(), {
  enableSearch: true,
  enableHighlight: true,
});

const activeIndex = ref<number>(-1);

watch(
  () => props.searchResult,
  () => {
    activeIndex.value = -1;
  },
  {
    immediate: true,
    deep: true,
  }
);
function setActiveIndex(index: number) {
  activeIndex.value = index;
  if (index < 0) {
    activeIndex.value = -1;
    return;
  } else {
    activeIndex.value = index;
  }
}

function confirmIndex(index: number) {
  setActiveIndex(-1);
  if (index >= 0 && props.searchResult && props.searchResult.length > index) {
    modelValue.value = props.searchResult[index].value;
  }
}
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex(activeIndex.value + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex(activeIndex.value - 1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    if (activeIndex.value >= 0) {
      confirmIndex(activeIndex.value);
    }
  }
}

const boxEle = useTemplateRef<HTMLDivElement>('boxEle');
function highlightSearchResult(query: string) {
  if (!props.enableHighlight || !boxEle.value) return;
  highlight(query, Array.from(boxEle.value?.querySelectorAll('.k-input-search-highlight') || []), 'search-results');
}

onUpdated(() => {
  highlightSearchResult(modelValue.value || '');
});
onMounted(() => {
  highlightSearchResult(modelValue.value || '');
});

</script>
<style scoped lang="scss">
.input-search {
  position: relative;
  width: fit-content;
}
.input-search-result-box {
  display: none;
  position: absolute;
  border: 1px solid;
  border-radius: 0.5em;

  box-sizing: border-box;
  width: 100%;
  padding: 0;
  flex-direction: column;
  padding: 0;

  overflow: auto;

  max-height: 200px;

  @include theme.use {
    background-color: theme.get('background');
    border-color: theme.get('color');
  }
}
.input-search-input:focus + .input-search-result-box,
.input-search-input:active + .input-search-result-box,
.input-search-result-box:focus-within,
.input-search-result-box:hover {
  display: flex;
}
.input-search-result-item {
  padding: 0.5em;
  border: none;
  outline: none;
  background-color: transparent;
  text-align: left;
  cursor: pointer;
  &:hover {
    @include theme.use {
      background-color: theme.mix('background', 'active-color', 80%);
    }
  }
  &.active {
    @include theme.use {
      background-color: theme.mix('background', 'strong-color', 80%);
    }
  }
}
</style>
