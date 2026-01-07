<script setup lang="ts">
import { DsfrSideMenu } from '@gouvminint/vue-dsfr'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

const headingTitle = computed(() => group.value ? `${group.value.name}` : 'Groupe')

const $route = useRoute()

watch($route, () => {
  groupStore.refreshGroup()
})

const menuItems = ref([{
  id: '11',
  to: `base`,
  active: computed(() => $route.fullPath.endsWith('base')),
  text: 'Informations',
  requiredLevel: 0,
}, {
  id: '12',
  to: `users`,
  active: computed(() => $route.fullPath.endsWith('users')),
  text: 'Utilisateurs',
  requiredLevel: 0,
}, {
  id: '13',
  to: `teams`,
  active: computed(() => $route.fullPath.endsWith('teams')),
  text: 'Équipes',
  requiredLevel: 10,
}, {
  id: '14',
  to: `settings`,
  active: computed(() => $route.fullPath.endsWith('settings')),
  text: 'Paramètres',
  requiredLevel: 20,
}])
</script>

<template>
  <DsfrSideMenu
    :heading-title="headingTitle"
    :menu-items="menuItems.filter(item => groupStore.mylevel >= item.requiredLevel)"
    collapse-value="a"
    title-tag="h2"
    button-label="Menu du groupe"
    :class="{ 'has-notifications': group.requests.length && groupStore.mylevel >= 20 }"
  />
</template>

<style>
li::marker {
  display: none;
  content: "";
  height: 0;
  width: 0;
  position: fixed;
}
li {
  list-style-type: none;
}
.has-notifications .fr-sidemenu__item:nth-child(2):after {
  background-color: var(--border-default-red-marianne) !important;
  content: '';
  position: absolute;
  right: 0.2rem;
  font-weight: 900;
  top: calc(50% - (1rem / 2));
  height: 1rem;
  width: 1rem;
  /* clip-path for round background*/
  clip-path: circle(20%);
}
</style>
