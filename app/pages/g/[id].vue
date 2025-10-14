<script setup lang="ts">
import { DsfrButton } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'
import MembersTable from '~/components/MembersTable.vue'

const id = useRoute().params.id
const config = useRuntimeConfig()
const rootGroupPrefix = config.public.keycloak.rootGroupPath.endsWith('/')
  ? config.public.keycloak.rootGroupPath
  : `${config.public.keycloak.rootGroupPath}/`

const group = ref<GroupDtoType | null>(null)
async function fetchData() {
  const data = await fetcher(`/api/v1/groups/get`, {
    method: 'get',
    params: { id },
  })
  group.value = data
}

onBeforeMount(fetchData)

const { $keycloak } = useNuxtApp()

const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => group.value?.members.find(m => m.id === userId.value)?.membershipLevel || 0)

function triggerAction<F extends (...args: any[]) => Promise<void>>(fn: F) {
  fn().finally(() => fetchData())
}
</script>

<template>
  <div
    v-if="group"
    class="flex flex-col gap-6"
  >
    <div class="flex justify-between items-center">
      <h2 class="fr-mb-0">
        <span
          class="path-prefix"
          title="Groupe racine"
        >{{ rootGroupPrefix }}</span>
        <span title="Nom du groupe">{{ group.name }}</span>
      </h2>
      <DsfrButton
        tertiary
        @click="fetchData"
      >
        Actualiser
      </DsfrButton>
    </div>
    <GroupBaseInfo
      :group="group"
      @refresh="fetchData"
    />
    <div class="flex flex-col xl:flex-col">
      <MembersTable
        :group
        @refresh="fetchData"
      />
      <TeamManager
        v-if="mylevel >= 10"
        :can-manage="mylevel >= 20"
        :group
        class="mb-8"
        @refresh="fetchData"
      />
    </div>
    <div
      v-if="[0, 20, 30].includes(mylevel)"
      class="flex lg:flex-row flex-col gap-16"
    >
      <!-- Formulaire d'ajout de membre -->
      <div
        class="grow"
      >
        <InviteMember
          :group-id="group.id"
          @refresh="fetchData"
        />
      </div>
      <div class="grow">
        <InviteForm
          v-if="mylevel === 0"
          :group="group"
          @cancel-request="triggerAction(cancelRequest.bind(null, group.id, userId))"
          @create-request="triggerAction(createRequest.bind(null, group.id))"
          @decline-invite="triggerAction(declineInvite.bind(null, group.id))"
          @accept-invite="triggerAction(acceptInvite.bind(null, group.id))"
        />
        <InvitesList
          v-else-if="mylevel >= 20"
          :group="group"
          @refresh="fetchData"
        />
      </div>
    </div>
    <DangerZone
      :group="group"
    />
  </div>
</template>

<style scoped>
.path-prefix {
  opacity: 0.6;
}
</style>
