<script setup lang="ts">
const config = useRuntimeConfig()
useHead({
  title: `${config.public.appTitle} - Accueil`,
})
</script>

<template>
  <Dashboard />
</template>
