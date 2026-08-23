<template>
  <div class="box">
    <h1>新建地址</h1>
    <form @submit.prevent="submitForm">
      <p>呼号：
      <input type="text" id="callsign" name="callsign" required v-model="callsign"></p>
      <p>邮政编码：
      <input type="text" id="postalCode" name="postalCode" required v-model="postalCode"></p>
      <p>地址：
      <input type="text" id="address" name="address" required v-model="address"></p>
      <p>收件人姓名：
      <input type="text" id="recipientName" name="recipientName" required v-model="recipientName"></p>
      <p><button type="submit">提交</button></p>
    </form>
  </div>
</template>
<script setup lang="ts">
import { type CreateAddressRequest, newAddress } from '@/api/update';

const props = defineProps<{
  callsign?: string;
}>();

const callsign = ref(props.callsign || '');
const postalCode = ref('');
const address = ref('');
const recipientName = ref('');



const submitForm = () => {
  const options: CreateAddressRequest = {
    callsign: callsign.value,
    postalCode: postalCode.value,
    address: address.value,
    recipientName: recipientName.value|| undefined,
  };
  newAddress(options)
    .then(() => {
      alert('提交成功');
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
</style>
