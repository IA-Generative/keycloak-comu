<script setup lang="ts">
import DangerZone from '~/components/group/DangerZone.vue'
import GroupSettings from '~/components/group/GroupSettings.vue'

const props = defineProps<{
  myLevel: number
}>()
watch(() => props.myLevel, (newLevel) => {
  if (newLevel < 20) {
    // Rediriger vers la page de base du groupe si l'utilisateur n'a pas les droits nécessaires pour accéder aux paramètres
    navigateTo(`base`)
  }
}, { immediate: true })
</script>

<template>
  <div>
    <GroupSettings />
    <DangerZone />
  </div>
</template>
