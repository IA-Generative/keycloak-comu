import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({

  history: createWebHistory(),
  routes: [
    {
      path: '/invite/:code',
      name: 'invite',
      component: () => import('@/pages/InvitePage.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/IndexPage.vue'),
      children: [

        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/pages/ProfilePage.vue'),
        },
        {
          path: 'g/:id',
          component: () => import('@/pages/GroupLayout.vue'),
          children: [
            {
              path: '',
              redirect: (to) => ({ path: `/g/${String(to.params.id)}/base` }),
            },
            {
              path: 'base',
              name: 'group-base',
              component: () => import('@/pages/group/GroupBase.vue'),
            },
            {
              path: 'users',
              name: 'group-users',
              component: () => import('@/pages/group/GroupUsers.vue'),
            },
            {
              path: 'invites',
              name: 'group-invites',
              component: () => import('@/pages/group/GroupInvites.vue'),
            },
            {
              path: 'settings',
              name: 'group-settings',
              component: () => import('@/pages/group/GroupSettings.vue'),
            },
            {
              path: 'teams',
              name: 'group-teams',
              component: () => import('@/pages/group/GroupTeams.vue'),
            },
          ],
        },]
    },
  ],
})

export default router
