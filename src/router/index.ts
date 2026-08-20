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
      path: '/new-log',
      name: 'new-log',
      component: () => import('@/views/NewLog.vue'),
      meta: {
        title: '新增通联记录',
      },
    }
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
