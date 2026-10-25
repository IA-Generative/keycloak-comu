<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { useGroupStore } from '@/stores/group'
import SideMenu from '@/components/group/SideMenu.vue'
import GroupAccess from '@/components/group/GroupAccess.vue'
import type { GroupDtoType } from '@/shared/types'
import { useAppConfig } from '@/composables/useAppConfig'
import { useProvenance } from '@/composables/useProvenance'
import { DsfrAlert, DsfrButton } from '@gouvminint/vue-dsfr'

const appConfig = useAppConfig()
const groupStore = useGroupStore()
const route = useRoute()
const id = route.params.id

const group = computed<GroupDtoType | null>(() => groupStore.group)

// Venu d'une autre application pour créer ce groupe : lui proposer d'y revenir (origine autorisée seulement).
const { provenance, retourAutorise, nomDuRetour, oublierProvenance } = useProvenance()
const lienRetour = computed(() => retourAutorise(provenance.value.retour, appConfig.value.allowedReturnOrigins))
const nomRetour = computed(() => nomDuRetour(provenance.value.retour))
function revenir() {
  const url = lienRetour.value
  oublierProvenance()
  window.location.assign(url)
}

async function fetchData() {
  await groupStore.fetchGroup(id as string)
  document.title = `${appConfig.value.appTitle} - Gestion du groupe ${group.value?.name}`
}

let interval: ReturnType<typeof setInterval>
onMounted(() => {
  fetchData()
  interval = setInterval(() => {
    groupStore.refreshGroup()
  }, 30000)
})

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>

<template>
  <div v-if="group && lienRetour" class="fr-container fr-mt-2w">
    <DsfrAlert type="success" small :title="`Votre groupe « ${group.name} » est prêt`"
      :description="`Invitez vos collègues ici, puis revenez à ${nomRetour} : vos groupes y seront relus.`" :closeable="true"
      @close="oublierProvenance">
      <DsfrButton class="fr-mt-1w" size="sm" @click="revenir">Revenir à {{ nomRetour }}</DsfrButton>
    </DsfrAlert>
  </div>
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
