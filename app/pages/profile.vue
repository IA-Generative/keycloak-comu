<script setup lang="ts">
import UserInfos from '~/components/profile/UserInfos.vue'
import UserSettings from '~/components/profile/UserSettings.vue'
import { featureFlags } from '#imports'

const config = useRuntimeConfig()
useHead({
  title: `${config.public.appTitle} - Profil`,
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
