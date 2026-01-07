<script setup lang="ts">
import SideMenu from '~/components/group/SideMenu.vue'

const groupStore = useGroupStore()
const id = useRoute().params.id

const group = ref<GroupDtoType | null>(null)

async function fetchData() {
  const data = await groupStore.fetchGroup(id as string)
  group.value = data
  useHead({
    title: `Keycloak Comu - Gestion du groupe ${data?.name}`,
  })
}

onBeforeMount(fetchData)

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
      <NuxtPage />
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
