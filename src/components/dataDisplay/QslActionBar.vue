<template>
  <div class="action-bar">
    <a :href="newSendHref" target="_blank">新增QSL发件</a>
    <a :href="newReceiveHref" target="_blank">新增QSL收件</a>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  callsign?: string;
}>();

const newSendHref = computed(() => {
  if (!props.callsign) return '/new-qsl-send';
  return `/new-qsl-send?callsign=${encodeURIComponent(props.callsign)}`;
});

const newReceiveHref = computed(() => {
  if (!props.callsign) return '/new-qsl-receive';
  return `/new-qsl-receive?callsign=${encodeURIComponent(props.callsign)}`;
});
</script>

<style scoped lang="scss">
.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-bottom: 1em;

  a {
    padding: 0.2em 0.5em;
    border: 1px solid;
    border-radius: 4px;
    background: transparent;
    text-decoration: none;
    font-size: 1em;
    @include theme.use {
      color: theme.mix('color', 'active-color', 50%);
      border-color: theme.mix('color', 'active-color', 50%);
    }
  }
}
</style>
