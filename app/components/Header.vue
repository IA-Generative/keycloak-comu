<script setup lang="ts">
import { DsfrHeader } from '@gouvminint/vue-dsfr'
import type { DsfrHeaderMenuLinkProps } from '@gouvminint/vue-dsfr'
import type { KeycloakTokenParsed } from 'keycloak-js'

const props = defineProps<{
  loggedIn: boolean
  logoText: string
  keycloakToken?: KeycloakTokenParsed
}>()

const emits = defineEmits<{
  (e: 'logout'): void
  (e: 'login'): void
}>()

const notificationsStore = useNotificationsStore()

const isDisplayingNotifications = ref(false)
function logout() {
  emits('logout')
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
    to: '',
    onClick: ($event: Event) => {
      $event.preventDefault()
      displayNotifications()
    },
  }
})

const profileLink = computed<DsfrHeaderMenuLinkProps>(() => ({
  label: 'Profil',
  to: '/profile',
  icon: {
    name: 'ri-user-line',
  },
}))
const logoutLink = {
  label: 'Déconnexion',
  to: '#',
  onClick: logout,
  icon: {
    name: 'ri-logout-box-line',
  },
}
const loginLink = {
  label: 'Connexion',
  to: '#',
  onClick: () => emits('login'),
  icon: {
    name: 'ri-login-box-line',
  },
}

const homeLink = {
  label: 'Accueil',
  to: '/',
  icon: {
    name: 'ri-home-line',
  },
}

const quickLinks = computed<DsfrHeaderMenuLinkProps[]>(() => {
  const newLinks: (DsfrHeaderMenuLinkProps)[] = [
    homeLink,
  ]
  if (props.loggedIn) {
    newLinks.push(notificationsLink.value)
    newLinks.push(profileLink.value)
    newLinks.push(logoutLink)
  } else {
    newLinks.push(loginLink)
  }
  return newLinks
})
</script>

<template>
  <DsfrHeader
    home-to="/"
    :quick-links="quickLinks"
    :logo-text="logoText"
    class="grow-0"
  />
  <NotificationsList
    :displaying="isDisplayingNotifications"
    :is-authenticated="loggedIn"
    @close="isDisplayingNotifications = false"
  />
</template>
