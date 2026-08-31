<script setup lang="ts">
import { ref } from 'vue'
import { DsfrButton, DsfrModal } from '@gouvminint/vue-dsfr'

const props = defineProps<{
  code: string
}>()

const emit = defineEmits<{ 'close': [] }>()

</script>

<template>
  <DsfrModal
    :opened="true"
    title="Lien d'invitation créé"
    @close="emit('close')"
  >
      <div v-html="code"></div>
    <template #footer>
      <DsfrButton label="Fermer" secondary @click="emit('close')" />
    </template>
  </DsfrModal>
</template>
