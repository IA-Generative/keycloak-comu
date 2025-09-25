<script setup lang="ts">
import { DsfrAlert } from '@gouvminint/vue-dsfr'

const messages = computed<Set<SnackBarMessage>>(() => snackbarMessages.value)
</script>

<template>
  <div
    class="fixed bottom-0 left-0 right-0 fr-container fr-pb-4w"
    style="z-index: 2000; pointer-events: none;"
  >
    <DsfrAlert
      v-for="message in messages"
      :key="message.id"
      class="fr-mb-2w"
      :description="message.text"
      type="error"
      closeable
      @close="removeMessage(message.id)"
    />
  </div>
</template>
