<template>
  <div class="action-bar">
    <template v-for="(action, index) in actions" :key="`${action.label}-${action.href}`">
      <span v-if="index > 0" class="separator">|</span>
      <a
        :href="action.href"
        :target="action.target"
        :rel="action.target === '_blank' ? 'noopener noreferrer' : undefined"
      >
        {{ action.label }}
      </a>
    </template>
  </div>
</template>

<script setup lang="ts">
export interface DataAction {
  label: string;
  href: string;
  target?: string;
}

defineProps<{
  actions: DataAction[];
}>();
</script>

<style scoped lang="scss">
.action-bar {
  display: inline;

  a {
    text-decoration: none;
    font-size: 1em;
    @include theme.use {
      color: theme.mix('color', 'active-color', 50%);
    }

    &:hover,
    &:focus {
      @include theme.use {
        color: theme.get('active-color');
      }
    }
  }
}

.separator {
  @include theme.use {
    color: theme.get('color');
  }
}
</style>
