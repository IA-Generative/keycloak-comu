<script setup lang="ts">
import TeamManager from '~/components/group/TeamManager.vue'

const props = defineProps<{
  myLevel: number
}>()
watch(() => props.myLevel, (newLevel) => {
  if (newLevel < 10) {
    // Rediriger vers la page de base du groupe si l'utilisateur n'a pas les droits nécessaires pour accéder aux paramètres
    navigateTo(`base`)
  }
}, { immediate: true })
</script>

<template>
  <TeamManager />
</template>
