<script setup lang="ts">
import { DsfrSideMenu } from '@gouvminint/vue-dsfr'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

const headingTitle = computed(() => group.value ? `${group.value.name}` : 'Groupe')

const $route = useRoute()

const menuItems = ref([
  {
    id: '11',
    to: `/g/${group.value.id}/base`,
    active: computed(() => $route.fullPath.endsWith('base')),
    text: 'Informations',
  },
  {
    id: '12',
    to: `/g/${group.value.id}/users`,
    active: computed(() => $route.fullPath.endsWith('users')),
    text: 'Utilisateurs',
  },
  {
    id: '13',
    to: `/g/${group.value.id}/teams`,
    active: computed(() => $route.fullPath.endsWith('teams')),
    text: 'Équipes',
  },
  {
    id: '14',
    to: `/g/${group.value.id}/settings`,
    active: computed(() => $route.fullPath.endsWith('settings')),
    text: 'Paramètres',
  },
])
</script>

<template>
  <DsfrSideMenu
    :heading-title="headingTitle"
    :menu-items="menuItems"
    collapse-value="a"
    title-tag="h2"
    button-label="Menu du groupe"
  />
</template>

<style module>
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
</style>
