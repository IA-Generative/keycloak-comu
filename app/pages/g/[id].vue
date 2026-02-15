<script setup lang="ts">
import SideMenu from '~/components/group/SideMenu.vue'

const config = useRuntimeConfig()
const groupStore = useGroupStore()
const id = useRoute().params.id

const group = computed<GroupDtoType | null>(() => groupStore.group)

async function fetchData() {
  await groupStore.fetchGroup(id as string)
  useHead({
    title: `${config.public.appTitle} - Gestion du groupe ${group.value?.name}`,
  })
}

onBeforeMount(fetchData)

let interval: NodeJS.Timeout
onMounted(() => {
  interval = setInterval(() => {
    groupStore.refreshGroup()
  }, 30000)
})

onBeforeUnmount(() => {
  clearInterval(interval)
})

definePageMeta({
  redirect: to => `/g/${to.params.id}/base`,
})
</script>

<template>
  <div
    v-if="group"
    class="fr-container grid layout"
  >
    <SideMenu />
    <div class="mt-5 md:mt-0">
      <NuxtPage
        :my-level="groupStore.mylevel"
      />
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
