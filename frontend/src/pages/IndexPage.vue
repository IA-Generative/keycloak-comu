<script setup lang="ts">
import { watchEffect } from 'vue'
import Dashboard from '@/components/Dashboard.vue'
import { useAppConfig } from '@/composables/useAppConfig'

const appConfig = useAppConfig()
watchEffect(() => {
  document.title = `${appConfig.value.appTitle} - Accueil`
})
</script>

<template>
  <Dashboard />
</template>
