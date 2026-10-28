import PageNotFoundView from '@/views/PageNotFoundView.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: {
        title: '首页',
        fullscreen: true,
        hideHeader: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: PageNotFoundView,
      meta: {
        title: '404',
      },
    },
    {
      path: '/communication-proof',
      name: 'communication-proof',
      component: () => import('@/views/CommunicationProof.vue'),
      meta: {
        title: '通联证明',
      },
    },
    {
      path: '/address-print',
      name: 'address-print',
      component: () => import('@/views/AddressPrint.vue'),
      meta: {
        title: '地址打印',
      },
    },
    {
      path: '/callsign/:callsign',
      name: 'callsign-detail',
      component: () => import('@/views/CallsignDetail.vue'),
      meta: {
        title: '呼号详情',
      },
      props: true,
    },
    {
      path: '/callsign-search',
      name: 'callsign-search',
      component: () => import('@/views/CallsignSearch.vue'),
      meta: {
        title: '呼号搜索',
      },
      props: true,
    },
    {
      path: '/new-log',
      name: 'new-log',
      component: () => import('@/views/NewLog.vue'),
      meta: {
        title: '新增通联记录',
      },
    },
    {
      path: '/new-address',
      name: 'new-address',
      component: () => import('@/views/NewAddress.vue'),
      meta: {
        title: '新建地址',
      },
    },
    {
      path: '/manual-email',
      name: 'manual-email',
      component: () => import('@/views/ManualEmail.vue'),
      meta: {
        title: '手动更新邮箱',
      },
    },
    {
      path: '/edit-address',
      name: 'edit-address',
      component: () => import('@/views/EditAddress.vue'),
      meta: {
        title: '编辑地址',
      },
    },
    {
      path: '/address-list',
      name: 'address-list',
      component: () => import('@/views/AddressList.vue'),
      meta: {
        title: '地址列表',
      },
    },
    {
      path: '/new-qsl-send',
      name: 'new-qsl-send',
      component: () => import('@/views/NewQSLSend.vue'),
      meta: {
        title: '新增 QSL 发件记录',
      },
    },
    {
      path: '/new-qsl-receive',
      name: 'new-qsl-receive',
      component: () => import('@/views/NewQSLReceive.vue'),
      meta: {
        title: '新增 QSL 收件记录',
      },
    },
    {
      path: '/confirm-qsl-send',
      name: 'confirm-qsl-send',
      component: () => import('@/views/ConfirmQSLSend.vue'),
      meta: {
        title: '确认 QSL 发件记录',
      },
    },
    {
      path: '/qsl-manager',
      name: 'qsl-manager',
      component: () => import('@/views/QslManager.vue'),
      meta: {
        title: 'QSL 管理',
      },
    },
    {
      path: '/email-prepare',
      name: 'email-prepare',
      component: () => import('@/views/EmailPrepare.vue'),
      meta: {
        title: '准备邮件',
      },
    },
    {
      path: '/send-email',
      name: 'send-email',
      component: () => import('@/views/SendEmail.vue'),
      meta: {
        title: '发送邮件',
      },
    },
  ],
});

const defaultTitle = 'Scale';
router.beforeEach((to) => {
  title.value = (to.meta.title as string) || defaultTitle;
  fullscreen.value = (to.meta.fullscreen as boolean) || false;
  hideHeader.value = (to.meta.hideHeader as boolean) || false;
  return;
});

export const title = ref(defaultTitle);
export const fullscreen = ref(false);
export const hideHeader = ref(false);

watch(
  title,
  (newTitle) => {
    document.title = newTitle;
  },
  {
    immediate: true,
  }
);

export default router;
