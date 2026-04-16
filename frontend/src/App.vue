<script setup lang="ts">
import '@gouvfr/dsfr/dist/dsfr.min.css'
import '@gouvminint/vue-dsfr/styles'

import { DsfrFooter, useScheme } from '@gouvminint/vue-dsfr'
import { ref, computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { handleOidcCallbackIfPresent, getCurrentUser, login, logout } from '@/composables/useOidc'
import { useNotificationsStore } from '@/stores/notifications'
import { loadFeatureFlags } from '@/composables/feature-flags'
import { useAppConfig } from '@/composables/useAppConfig'
import Header from '@/components/Header.vue'
import SnackBar from '@/components/SnackBar.vue'

const username = ref('')
const loggedIn = ref(false)
const notificationsStore = useNotificationsStore()

function doLogout() {
  logout()
}

onMounted(async () => {
  try {
    let user = await handleOidcCallbackIfPresent()
    if (!user) {
      user = await getCurrentUser()
    }
    if (user?.access_token) {
      username.value = user.profile?.preferred_username ?? ''
      loggedIn.value = true
      await notificationsStore.fetchNotifications()
      loadFeatureFlags()
    } else {
      await login()
    }
  } catch (err) {
    console.error('Auth init failed', err)
  }
})

const themeLight = {
  label: 'Clair',
  next: 'dark',
}
const themeDark = {
  label: 'Sombre',
  next: 'system',
}
const themes = {
  light: themeLight,
  dark: themeDark,
}

// @ts-expect-error useScheme types
const { setScheme, theme } = useScheme()
function changeTheme() {
  setScheme(theme.value === 'light' ? 'dark' : 'light')
}

const appConfig = useAppConfig()

const afterMandatoryLinks = computed(() => {
  return [
    {
      label: `Theme: ${themes[theme.value as keyof typeof themes].label}`,
      button: true,
      to: '#',
      onClick: changeTheme,
    },
    {
      label: `Version: ${appConfig.value?.version}`,
      external: true,
      href: `https://github.com/IA-Generative/keycloak-comu/releases/tag/v${appConfig.value?.version}`,
    },
  ]
})
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Header :logged-in="loggedIn" :logo-text="appConfig.value?.appTitle" @logout="doLogout" @login="login" />

    <div class="fr-container fr-mt-4w grow">
      <RouterView v-if="loggedIn" />
      <SnackBar />
    </div>
    <div class="grow-0 bottom-0">
      <DsfrFooter class="fr-mt-8w" :after-mandatory-links="afterMandatoryLinks" />
    </div>
  </div>
</template>
