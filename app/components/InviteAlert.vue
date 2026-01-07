<script setup lang="ts">
import { DsfrAlert, DsfrButton } from '@gouvminint/vue-dsfr'

const props = defineProps<{
  group: ListGroupDtoType['invited'][0]
}>()

const emits = defineEmits<{
  (e: 'refresh'): void
}>()

const groupStore = useGroupStore()

function triggerAction(fn: (groupId: string) => Promise<void>) {
  fn(props.group.id).then(() => {
    emits('refresh')
  })
}
</script>

<template>
  <DsfrAlert
    small
    type="info"
    class="fr-mb-2w flex flex-wrap"
  >
    <div>
      Vous avez été invité à rejoindre le groupe <NuxtLink :to="`/g/${group.id}`">
        {{ group.name }}
      </NuxtLink>.<br>
      <span class="fr-text--xs">
        Vous acceptez implicitement les conditions d'utilisation du groupe en rejoignant celui-ci
      </span>
    </div>
    <div class="self-center">
      <DsfrButton
        size="small"
        class="fr-ml-2w"
        @click="triggerAction(groupStore.acceptInvite)"
      >
        Accepter
      </DsfrButton>
      <DsfrButton
        size="small"
        secondary
        class="fr-ml-2w"
        @click="triggerAction(groupStore.declineInvite)"
      >
        Refuser
      </DsfrButton>
    </div>
  </DsfrAlert>
</template>
