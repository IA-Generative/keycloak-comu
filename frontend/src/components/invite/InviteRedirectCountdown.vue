<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { DsfrButton } from '@gouvminint/vue-dsfr'

const props = defineProps<{
  redirectUrl: string
  title?: string
}>()

const title = props.title ?? props.redirectUrl
const emit = defineEmits<{ cancel: [] }>()

const secondsLeft = ref(5)
let timer: ReturnType<typeof setInterval>

function goNow() {
  clearInterval(timer)
  window.location.href = props.redirectUrl
}

function cancel() {
  secondsLeft.value = -1
  clearInterval(timer)
  emit('cancel')
}

onMounted(() => {
  timer = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) {
      clearInterval(timer)
      window.location.href = props.redirectUrl
    }
  }, 1000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="fr-callout fr-callout--blue-ecume fr-mt-4w">
    <p v-if="secondsLeft > 0" class="fr-callout__title">
      Redirection dans {{ secondsLeft }}s vers {{ title }}
    </p>
    <p class="fr-callout__text fr-text--sm fr-text-mention--grey">
      Vous allez être redirigé vers&nbsp;:
      <a :href="props.redirectUrl" class="fr-link fr-link--sm">{{ title }}</a>
    </p>
    <div class="flex gap-3 fr-mt-2w">
      <DsfrButton label="Y aller maintenant" @click="goNow" />
      <DsfrButton secondary label="Annuler" @click="cancel" />
    </div>
  </div>
</template>
