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
      props: (route) => ({
        callsign:
          typeof route.query.callsign === 'string'
            ? route.query.callsign
            : Array.isArray(route.query.callsign)
              ? route.query.callsign[0]
              : undefined,
      }),
      meta: {
        title: '新增通联记录',
      },
    },
    {
      path: '/new-address',
      name: 'new-address',
      component: () => import('@/views/NewAddress.vue'),
      props: (route) => ({
        callsign:
          typeof route.query.callsign === 'string'
            ? route.query.callsign
            : Array.isArray(route.query.callsign)
              ? route.query.callsign[0]
              : undefined,
      }),
      meta: {
        title: '新建地址',
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
