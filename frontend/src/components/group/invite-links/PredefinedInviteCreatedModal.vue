<script setup lang="ts">
import { ref } from 'vue'
import { DsfrButton, DsfrModal } from '@gouvminint/vue-dsfr'
import type { PredefinedInvite } from '@/shared/types'
import { addMessage } from '@/composables/snackbarManager';
import { copyLink, createPublicInviteLink } from '@/utils/functions';

const props = defineProps<{
  opened: boolean
  invite: PredefinedInvite
}>()

const emit = defineEmits<{ 'update:opened': [boolean] }>()

const copied = ref(false)
</script>

<template>
  <DsfrModal
    v-if="opened"
    :opened="opened"
    title="Lien d'invitation créé"
    @close="emit('update:opened', false)"
  >
    <p class="fr-text--sm fr-mb-1w">
      Partagez ce lien pour inviter des utilisateurs directement :
    </p>
    <div class="flex items-center gap-2 fr-p-2w " style="background: var(--background-alt-grey); border-radius: 4px; word-break: break-all;">
      <code class="grow">{{ createPublicInviteLink(invite.code) }}</code>
      <DsfrButton
        secondary
        size="small"
        icon-only
        :icon="copied ? 'ri-check-line' : 'ri-file-copy-line'"
        :title="copied ? 'Copié !' : 'Copier le lien'"
        @click="copyLink(invite.code, ref(copied))"
      />
    </div>
    <template #footer>
      <DsfrButton label="Fermer" secondary @click="emit('update:opened', false)" />
    </template>
  </DsfrModal>
</template>
