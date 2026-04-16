<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import UserInfos from '@/components/profile/UserInfos.vue'
import UserSettings from '@/components/profile/UserSettings.vue'
import { featureFlags } from '@/composables/feature-flags'
import { useAppConfig } from '@/composables/useAppConfig'

const appConfig = useAppConfig()
watchEffect(() => {
  document.title = `${appConfig.value.appTitle} - Profil`
})

const displayUserSettings = computed(() => {
  return featureFlags.value.includes('userSettings')
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <UserInfos />
    <UserSettings :enabled="displayUserSettings" />
  </div>
</template>
