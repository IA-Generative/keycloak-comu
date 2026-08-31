<script setup lang="ts">
import { computed, ref } from 'vue'
import { DsfrButton, DsfrDataTable } from '@gouvminint/vue-dsfr'
import type { DsfrDataTableHeaderCell } from '@gouvminint/vue-dsfr'
import type { PredefinedInvite } from '@/shared/types'
import { copyLink } from '@/utils/functions';

const props = defineProps<{
  invites: PredefinedInvite[]
  canManage: boolean
}>()

const emit = defineEmits<{
  delete: [invite: PredefinedInvite]
  "show-qr": [invite: PredefinedInvite]
}>()

const page = ref(0)
const rowsPerPage = ref(10)
const copied = ref(false)

const headers: DsfrDataTableHeaderCell[] = [
  { label: 'Code', key: 'code' },
  { label: 'Redirection', key: 'redirectUrl' },
  { label: 'Rôle', key: 'role' },
  { label: 'Équipes', key: 'teams' },
  ...(props.canManage ? [{ label: '', key: 'actions' }] : []),
]

type Row = {
  code: string
  role: string
  redirectUrl: string
  teams: string
  actions: PredefinedInvite
}

const ROLE_LABELS: Record<string, string> = {
  member: 'Membre',
  admin: 'Administrateur',
  owner: 'Propriétaire',
}

const rows = computed<Row[]>(() =>
  props.invites.map(inv => ({
    code: inv.code,
    role: ROLE_LABELS[inv.role] ?? inv.role,
    redirectUrl: inv.redirectUrl || '—',
    teams: inv.teams?.length ? inv.teams.join(', ') : '—',
    // copy and actions share the same invite object as cell value
    actions: inv,
  })),
)
</script>

<template>
  <DsfrDataTable
    v-model:current-page="page"
    v-model:rows-per-page="rowsPerPage"
    no-caption
    title="Liens d'invitation prédéfinis"
    :headers-row="headers"
    :rows="rows"
    pagination
    :pagination-options="[10, 20, 50]"
  >
    <template #cell="{ colKey, cell }">
      <template v-if="colKey === 'code'">
        <DsfrButton
          v-if="cell"
          size="small"
          tertiary
          :label="cell"
          :icon="copied ? 'ri-check-line' : 'ri-file-copy-line'"
          :title="copied ? 'Copié !' : 'Copier le lien'"
          @click="copyLink(cell, ref(copied))"
        />
      </template>
      <template v-else-if="colKey === 'actions' && canManage">
        <div class="flex gap-2">
          <DsfrButton
            size="small"
            secondary
            icon-only
            icon="ri-qr-code-line"
            title="Afficher le QR code"
            @click="emit('show-qr', (cell as Row['actions']))"
          />
          <DsfrButton
            size="small"
            secondary
            icon-only
            icon="ri-delete-bin-line"
            title="Supprimer"
            @click="emit('delete', (cell as Row['actions']))"
          />
        </div>
      </template>
      <template v-else>
        {{ cell }}
      </template>
    </template>
  </DsfrDataTable>
  <p v-if="!invites.length" class="fr-text--sm fr-text-mention--grey fr-mt-1w">
    Aucun lien d'invitation prédéfini.
  </p>
</template>
