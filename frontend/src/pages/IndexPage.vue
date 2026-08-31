<script setup lang="ts">
import { watchEffect, onUnmounted, ref, onMounted } from 'vue'
import { DsfrFooter, useScheme } from '@gouvminint/vue-dsfr'
import Dashboard from '@/components/Dashboard.vue'
import { useAppConfig } from '@/composables/useAppConfig'
import { computed } from 'vue'
import { getCurrentUser, handleOidcCallbackIfPresent, login, logout } from '@/composables/useOidc'
import { useNotificationsStore } from '@/stores/notifications'
import Header from '@/components/Header.vue'
import SnackBar from '@/components/SnackBar.vue'
import router from '@/router'
import { loadFeatureFlags } from '@/composables/feature-flags'

const loggedIn = ref(false)
const username = ref('')
const notificationsStore = useNotificationsStore()

const appConfig = useAppConfig()
watchEffect(() => {
  document.title = `${appConfig.value.appTitle} - Accueil`
})

onMounted(async () => {
  try {
    let user = await handleOidcCallbackIfPresent()

    if (user?.expired) {
      await login()
      return 
    }
    
    if (!user) {
      user = await getCurrentUser()
      if (user?.expired) {
        await login()
        return 
      }
      if (!user) {
        await login()
      }
    }
    if (user?.access_token) {
      username.value = user.profile?.preferred_username ?? ''
      loggedIn.value = true
      await notificationsStore.fetchNotifications()
      notificationsStore.startStream()
      loadFeatureFlags()
    } else {
      notificationsStore.stopStream()
    }
  } catch (err) {
    console.error('Auth init failed', err)
  }
})

onUnmounted(() => {
  notificationsStore.stopStream()
})

function doLogout() {
  logout()
}

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
    <Header :logged-in="loggedIn" :logo-text="appConfig?.appTitle" @logout="doLogout" @login="login" />

    <div v-if="loggedIn" class="fr-container fr-mt-4w grow">
      <Dashboard v-if="router.currentRoute.value.path === '/' "/>
      <RouterView />
      <SnackBar />
    </div>
    <div class="grow-0 bottom-0">
      <DsfrFooter class="fr-mt-8w" :after-mandatory-links="afterMandatoryLinks" />
    </div>
  </div>
</template>
