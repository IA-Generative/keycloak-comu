<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DsfrButton, DsfrModal } from '@gouvminint/vue-dsfr'
import { addMessage } from '@/composables/snackbarManager'
import * as backend from '@/composables/useBackend'
import { useGroupStore } from '@/stores/group'
import type { InviteLinkParameters, PredefinedInvite } from '@/shared/types'
import PredefinedInviteLinksTable from './PredefinedInviteLinksTable.vue'
import PredefinedInviteLinkModal from './PredefinedInviteLinkModal.vue'
import PredefinedInviteCreatedModal from './PredefinedInviteCreatedModal.vue'
import { createPublicInviteLink, generateQRCode } from '@/utils/functions.ts'
import PredefinedInviteQrCode from './PredefinedInviteQrCode.vue'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group)
const mylevel = computed(() => groupStore.mylevel)

const canManage = computed(() => mylevel.value >= 20)
const maxRole = computed<'member' | 'admin' | 'owner'>(() =>
  mylevel.value >= 30 ? 'owner' : 'admin',
)

const groupTeams = computed(() =>
  (group.value?.teams ?? []).map(t => t.name),
)

const invites = ref<PredefinedInvite[]>([])
const loading = ref(false)
const createOpen = ref(false)
const createdInvite = ref<PredefinedInvite | null>(null)
const createdModalOpen = ref(false)

async function refresh() {
  if (!group.value?.id) return
  loading.value = true
  try {
    invites.value = await backend.listPredefinedInvites(group.value.id)
  }
  catch {
    addMessage({ type: 'error', text: 'Impossible de charger les liens d\'invitation.' })
  }
  finally {
    loading.value = false
  }
}

async function onCreate(payload: InviteLinkParameters) {
  if (!group.value?.id) return
  loading.value = true
  try {
    const result = await backend.createPredefinedInvite({
      groupId: group.value.id,
      role: payload.role,
      redirectUrl: payload.redirectUrl || undefined,
      expiresAt: payload.expiresAt || undefined,
      countLeft: payload.countLeft,
      teams: payload.teams?.length ? payload.teams : undefined,
    })
    createOpen.value = false
    createdInvite.value = result
    createdModalOpen.value = true
    await refresh()
  }
  catch {
    addMessage({ type: 'error', text: 'Erreur lors de la création du lien.' })
  }
  finally {
    loading.value = false
  }
}

async function onDelete(invite: PredefinedInvite) {
  if (!group.value?.id) return
  // eslint-disable-next-line no-alert
  if (!window.confirm(`Supprimer le lien ${invite.code} ?`)) return
  loading.value = true
  try {
    await backend.deletePredefinedInvite(group.value.id, invite.code)
    addMessage({ type: 'success', text: 'Lien d\'invitation supprimé.' })
    await refresh()
  }
  catch {
    addMessage({ type: 'error', text: 'Erreur lors de la suppression du lien.' })
  }
  finally {
    loading.value = false
  }
}

const qrCodeSvg = ref<string | null>(null)
async function showQrCode(invite: PredefinedInvite) {
  if (!group.value?.id) return
  try {
    const qrCode = generateQRCode(createPublicInviteLink(invite.code))
    qrCodeSvg.value = qrCode
  }
  catch {
    addMessage({ type: 'error', text: 'Erreur lors de la génération du QR code.' })
  }
}
onMounted(refresh)
</script>

<template>
  <section class="fr-mt-6w">
    <div class="flex justify-between items-center gap-4 flex-wrap fr-mb-2w">
      <h3 class="fr-mb-0">
        Liens d'invitation prédéfinis
      </h3>
      <DsfrButton
        v-if="canManage"
        icon="ri-add-line"
        :disabled="loading"
        @click="createOpen = true"
      >
        Nouveau lien
      </DsfrButton>
    </div>

    <PredefinedInviteLinksTable
      :invites="invites"
      :can-manage="canManage"
      @delete="onDelete"
      @show-qr="showQrCode"
    />

    <PredefinedInviteCreatedModal
      v-if="createdInvite"
      :opened="createdModalOpen"
      :invite="createdInvite"
      @update:opened="createdModalOpen = $event"
    />

    <PredefinedInviteLinkModal
      :opened="createOpen"
      mode="create"
      :group-teams="groupTeams"
      :max-role="maxRole"
      :initial="null"
      @update:opened="createOpen = $event"
      @submit="onCreate"
    />

    <PredefinedInviteQrCode
      v-if="qrCodeSvg"
      :opened="true"
      :code="qrCodeSvg"
      @close="qrCodeSvg = null"
    />
  </section>
</template>
