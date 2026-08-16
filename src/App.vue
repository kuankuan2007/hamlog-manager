<template>
  <div class="app-root" :class="{ fullscreen: fullscreen }">
    <page-header :hide="hideHeader" />
    <div class="app-body">
      <router-view
        v-model:titleValue="title"
        v-model:fullscreen="fullscreen"
        v-model:hide-header="hideHeader"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { title, fullscreen, hideHeader } from './router';
</script>
<style scoped lang="scss">
</style>
