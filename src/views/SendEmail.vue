<template>
  <div class="box">
    <h1>邮件发送信息</h1>
    <h2>{{ props.title }}</h2>
    <p>{{ props.to }}</p>
    <p class="content">{{ props.content }}</p>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  content: string
  title: string
  to: string
}>()
</script>
<style scoped lang="scss">
.content {
  white-space: pre-wrap;
}
.box {
  padding: 1em;
}
</style>
