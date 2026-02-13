<script setup lang="ts">
import '@gouvfr/dsfr/dist/dsfr.min.css' // Import des styles du DSFR //
import '@gouvminint/vue-dsfr/styles'
import { DsfrFooter, DsfrHeader, useScheme } from '@gouvminint/vue-dsfr'
import type { DsfrHeaderMenuLinkProps } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'
import type { KeycloakTokenParsed } from 'keycloak-js'
import NotificationsList from './components/NotificationsList.vue'

const username = ref('')
const loggedIn = ref(false)
const isDisplayingNotifications = ref(false)

const { $keycloak } = useNuxtApp()
const notificationsStore = useNotificationsStore()

onMounted(async () => {
  await $keycloak.init({ onLoad: 'login-required', checkLoginIframe: true })
  username.value = $keycloak.tokenParsed?.preferred_username
  loggedIn.value = true
  notificationsStore.fetchNotifications()

  // Rafraîchir le token avant expiration
  setInterval(async () => {
    if ($keycloak.updateToken) {
      const refreshed = await $keycloak.updateToken(30) // rafraîchit si <30s restant
      if (refreshed) console.log('Token refresh OK')
    }
  }, 20000)
  loadFeatureFlags()
})

function logout() {
  $keycloak.logout()
}

function getUserName(payload: KeycloakTokenParsed): string {
  if (payload.name) return payload.name
  if (payload.given_name && payload.family_name) {
    return `${payload.given_name} ${payload.family_name}`
  }
  return payload.preferred_username || 'Profil'
}

function displayNotifications() {
  isDisplayingNotifications.value = true
}

const notificationsLink = computed<DsfrHeaderMenuLinkProps>(() => {
  const unreadNotifications = notificationsStore.notificationsLength > 0
  return {
    label: `Notifications`,
    button: true,
    icon: {
      name: unreadNotifications ? 'ri-notification-3-fill' : 'ri-notification-3-line',
      animation: unreadNotifications ? 'ring' : undefined,
      class: unreadNotifications ? 'unread' : undefined,
    },
    iconRight: true,
    to: '',
    onClick: ($event: Event) => {
      $event.preventDefault()
      displayNotifications()
    },
  }
})

const profileLink = computed(() => ({
  label: getUserName($keycloak.tokenParsed as KeycloakTokenParsed),
  to: '/profile',
}))

const quickLinks = computed(() => {
  const newLinks: (DsfrHeaderMenuLinkProps)[] = [
    { label: 'Accueil', to: '/' },
  ]
  if (loggedIn.value) {
    newLinks.push(notificationsLink.value)
    newLinks.push(profileLink.value)
    newLinks.push({ label: 'Déconnexion', to: '#', onClick: logout })
  } else {
    newLinks.push({ label: 'Connexion', to: '#', onClick: () => $keycloak.login() })
  }
  return newLinks
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

// @ts-expect-error
const { setScheme, theme } = useScheme()
function changeTheme() {
  setScheme(theme.value === 'light' ? 'dark' : 'light')
}

const config = useRuntimeConfig()

const afterMandatoryLinks = computed(() => {
  return [
    {
      label: `Theme: ${themes[theme.value as keyof typeof themes].label}`,
      button: true,
      to: '#',
      onclick: changeTheme,
    },
    {
      label: `Version: ${config.public.version}`,
      external: true,
      href: `https://github.com/IA-Generative/keycloak-comu/releases/tag/v${config.public.version}`,
    },
  ]
})
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <DsfrHeader
      home-to="/"
      :quick-links="quickLinks"
      :logo-text="config.public.appTitle"
      class="grow-0"
    />

    <div class="fr-container fr-mt-4w grow">
      <NuxtPage v-if="loggedIn" />
      <SnackBar />
    </div>
    <div class="grow-0 bottom-0">
      <DsfrFooter
        class="fr-mt-8w"
        :after-mandatory-links="afterMandatoryLinks"
      />
    </div>
    <NotificationsList
      :displaying="isDisplayingNotifications"
      :is-authenticated="loggedIn"
      @close="isDisplayingNotifications = false"
    />
  </div>
</template>
