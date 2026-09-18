<template>
  <div class="box">
    <h1>手动更新邮箱</h1>
    <form @submit.prevent="submitForm">
      <p>
        呼号：
        <input v-model="callsignValue" type="text" required />
      </p>
      <p>
        邮箱：
        <input v-model="emailValue" type="email" required />
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

const props = defineProps<{
  callsign?: string;
  email?: string;
}>();

const callsignValue = ref(props.callsign || '');
const emailValue = ref(props.email || '');

const submitForm = () => {
  manualUpdateEmail({
    callsign: callsignValue.value,
    email: emailValue.value,
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
