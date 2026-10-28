<template>
  <div class="box">
    <h1>新建地址</h1>
    <form @submit.prevent="submitForm">
      <p>呼号： <KInputCallsign id="callsign" required v-model="args.callsign" /></p>
      <p>
        邮政编码：
        <input type="text" id="postalCode" name="postalCode" required v-model="args.postalCode" />
      </p>
      <p>地址： <input type="text" id="address" name="address" required v-model="args.address" /></p>
      <p>
        收件人姓名：
        <input type="text" id="recipientName" name="recipientName" v-model="args.recipientName" />
      </p>
      <p><button type="submit">提交</button></p>
    </form>
  </div>
</template>
<script setup lang="ts">
import { type CreateAddressRequest, newAddress } from '@/api/update';
import KInputCallsign from '@/components/input/KInputCallsign.vue';
import { getURLArgs } from '@/scripts/urlArgs';

const args = getURLArgs({
  callsign: { type: 'string' },
  postalCode: { type: 'string' },
  address: { type: 'string' },
  recipientName: { type: 'string' },
});

const submitForm = () => {
  const options: CreateAddressRequest = {
    callsign: args.callsign,
    postalCode: args.postalCode,
    address: args.address,
    recipientName: args.recipientName || undefined,
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
