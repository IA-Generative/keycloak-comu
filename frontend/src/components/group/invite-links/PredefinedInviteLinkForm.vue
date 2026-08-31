<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DsfrButton, DsfrInput, DsfrInputGroup, DsfrMultiselect, DsfrSelect } from '@gouvminint/vue-dsfr'
import type { InviteLinkParameters, PredefinedInvite } from '@/shared/types'

const props = defineProps<{
  groupTeams: string[]
  maxRole: 'member' | 'admin' | 'owner'
  initial?: PredefinedInvite | null
}>()

const emit = defineEmits<{
  submit: [payload: InviteLinkParameters]
  cancel: []
}>()

const ROLE_OPTIONS = [
  { value: 'member', text: 'Membre' },
  { value: 'admin', text: 'Administrateur' },
  { value: 'owner', text: 'Propriétaire' },
]

const visibleRoleOptions = computed(() => {
  if (props.maxRole === 'owner') return ROLE_OPTIONS
  if (props.maxRole === 'admin') return ROLE_OPTIONS.filter(r => r.value !== 'owner')
  return ROLE_OPTIONS.filter(r => r.value === 'member')
})

const role = ref('member')
const redirectUrl = ref('')
const selectedTeams = ref<(string | number)[]>([])

const teamOptions = computed(() =>
  props.groupTeams.map(t => ({ id: t, label: t })),
)

watch(
  () => props.initial,
  (inv) => {
    role.value = inv?.role ?? 'member'
    redirectUrl.value = inv?.redirectUrl ?? ''
    selectedTeams.value = inv?.teams ? [...inv.teams] : []
  },
  { immediate: true },
)

const isValid = computed(() => true)

function submit() {
  if (!isValid.value) return
  emit('submit', {
    role: role.value,
    redirectUrl: redirectUrl.value.trim() || undefined,
    teams: selectedTeams.value.map(String),
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <DsfrSelect
      v-model="role"
      label="Rôle attribué"
      hint="Un administrateur ne peut pas créer un lien pour un rôle supérieur au sien."
      :options="visibleRoleOptions"
    />

    <DsfrMultiselect
      v-if="groupTeams.length"
      v-model="selectedTeams"
      label="Équipes assignées (optionnel)"
      :options="teamOptions"
      :search="groupTeams.length > 5"
    />

    <div>
      <DsfrInputGroup
        v-model="redirectUrl"
        hint="URL vers laquelle l'utilisateur sera redirigé après avoir accepté l'invitation. Laisser vide pour rediriger vers la page du groupe."
        label="URL de redirection (optionnelle)"
        type="url"
        label-visible
        placeholder="https://..."
      />
    </div>


    <div class="flex gap-3 fr-mt-2w">
      <DsfrButton type="submit" :disabled="!isValid" label="Enregistrer" />
      <DsfrButton secondary type="button" label="Annuler" @click="emit('cancel')" />
    </div>
  </form>
</template>
