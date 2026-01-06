<script setup lang="ts">
import UserInfos from '~/components/profile/UserInfos.vue'
import UserSettings from '~/components/profile/UserSettings.vue'
import { featureFlags } from '#imports'

useHead({
  title: `Keycloak Comu - Profil`,
})

const displayUserSettings = computed(() => {
  return featureFlags.value.includes('userSettings')
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <UserInfos />
    <UserSettings
      :enabled="displayUserSettings"
    />
  </div>
</template>
