<script setup lang="ts">
import { computed, onBeforeMount, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { useGroupStore } from '@/stores/group'
import SideMenu from '@/components/group/SideMenu.vue'
import GroupAccess from '@/components/group/GroupAccess.vue'
import type { GroupDtoType } from '@/shared/types'
import { useAppConfig } from '@/composables/useAppConfig'

const appConfig = useAppConfig()
const groupStore = useGroupStore()
const route = useRoute()
const id = route.params.id

const group = computed<GroupDtoType | null>(() => groupStore.group)

async function fetchData() {
  await groupStore.fetchGroup(id as string)
  document.title = `${appConfig.value.appTitle} - Gestion du groupe ${group.value?.name}`
}

onBeforeMount(fetchData)

let interval: ReturnType<typeof setInterval>
onMounted(() => {
  interval = setInterval(() => {
    groupStore.refreshGroup()
  }, 30000)
})

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>

<template>
  <div v-if="group" class="fr-container grid layout">
    <SideMenu />
    <div class="mt-5 md:mt-0">
      <RouterView :my-level="groupStore.mylevel" />
      <GroupAccess />
    </div>
  </div>
</template>

<style scoped>
.path-prefix {
  opacity: 0.6;
}

.container {
  container-type: inline-size;
}

.container h2 {
  font-size: clamp(1.2rem, 6cqi, 3rem);
}

@media (min-width: 768px) {
  .layout {
    grid-template-columns: 200px 1fr;
  }
}
</style>
