<template>
  <div class="box">
    <form action="" @submit.prevent="formSubmit">
      <header class="page-header">
        <h1>地址列表</h1>
        <a href="/new-address" target="_blank">新增地址</a>
        <button type="submit">打印</button>
      </header>

      <p v-if="error" class="error">加载失败：{{ error }}</p>

      <div class="table-wrapper" v-if="addresses.length">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>呼号</th>
              <th>邮政编码</th>
              <th>地址</th>
              <th>收件人</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="address in addresses" :key="address.callsign">
              <td><input type="checkbox" name="callsigns" :value="address.callsign" /></td>
              <td>
                <RouterLink :to="`/callsign/${encodeURIComponent(address.callsign)}`">
                  {{ address.callsign }}
                </RouterLink>
              </td>
              <td>{{ address.postalCode }}</td>
              <td>{{ address.address }}</td>
              <td>{{ address.recipientName ?? '—' }}</td>
              <td>{{ address.updatedAt }}</td>
              <td>
                <a
                  :href="`/edit-address?callsign=${encodeURIComponent(address.callsign)}`"
                  target="_blank"
                >
                  更新
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!loading">暂无地址记录</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { selectAllAddresses } from '@/api/select';
import type { Address } from '@schema/address';

const addresses = ref<Address[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function loadAddresses(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    addresses.value = await selectAllAddresses();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

loadAddresses();

function formSubmit(e: SubmitEvent): void {
  const formData = new FormData(e.target as HTMLFormElement);
  if (formData.getAll('callsigns').length === 0) {
    alert('请选择要打印的地址。');
    return;
  }
  window.open(`/address-print?callsigns=${encodeURIComponent(formData.getAll('callsigns').join(','))}`, '_blank');
}
</script>

<style scoped lang="scss">
.box {
  padding: 1em;
}

.page-header {
  margin-bottom: 1em;

  a,
  button {
    padding: 0.2em 0.5em;
    border: 1px solid;
    border-radius: 4px;
    background: transparent;
    text-decoration: none;
    font-size: 1em;
    margin-right: 0.5em;
    cursor: pointer;
    @include theme.use {
      color: theme.mix('color', 'active-color', 50%);
      border-color: theme.mix('color', 'active-color', 50%);
    }
  }
}

.table-wrapper {
  overflow-x: auto;
}
</style>
