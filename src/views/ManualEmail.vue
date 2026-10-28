<template>
  <div class="box">
    <h1>手动更新邮箱</h1>
    <form @submit.prevent="submitForm">
      <p>
        呼号：
        <KInputCallsign v-model="args.callsign" required />
      </p>
      <p>
        邮箱：
        <input v-model="args.email" type="email" required />
      </p>
      <p>来源：<strong>manual</strong></p>
      <p>
        <button type="submit">提交</button>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { manualUpdateEmail } from '@/api/update';
import KInputCallsign from '@/components/input/KInputCallsign.vue';
import { getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({ callsign: { type: 'string' }, email: { type: 'string' } });

const submitForm = () => {
  manualUpdateEmail({
    callsign: args.callsign,
    email: args.email,
  })
    .then(() => {
      alert('邮箱已更新');
      window.close();
    })
    .catch((err) => {
      alert(`提交失败: ${err}`);
    });
};
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}

input {
  width: min(100%, 24rem);
}
</style>
