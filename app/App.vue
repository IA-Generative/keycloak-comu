<script setup lang="ts">
import '@gouvfr/dsfr/dist/dsfr.min.css' // Import des styles du DSFR //
import '@gouvminint/vue-dsfr/styles'
import { DsfrHeader } from '@gouvminint/vue-dsfr'
import type { DsfrHeaderMenuLinkProps } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'
import type { KeycloakTokenParsed } from 'keycloak-js'

const username = ref('')
const loggedIn = ref(false)

onMounted(async () => {
  const { $keycloak } = useNuxtApp()

  await $keycloak.init({ onLoad: 'login-required', checkLoginIframe: true })
  username.value = $keycloak.tokenParsed?.preferred_username
  loggedIn.value = true

  // Rafraîchir le token avant expiration
  setInterval(async () => {
    if ($keycloak.updateToken) {
      const refreshed = await $keycloak.updateToken(30) // rafraîchit si <30s restant
      if (refreshed) console.log('Token refresh OK')
    }
  }, 20000)
})

function logout() {
  const { $keycloak } = useNuxtApp()
  $keycloak.logout()
}

function getUserName(payload: KeycloakTokenParsed): string {
  if (payload.name) return payload.name
  if (payload.given_name && payload.family_name) {
    return `${payload.given_name} ${payload.family_name}`
  }
  return payload.preferred_username || 'Profil'
}

const quickLinks = ref<(DsfrHeaderMenuLinkProps & { text: string })[]>([])
watch(loggedIn, (newVal) => {
  const { $keycloak } = useNuxtApp()
  if (newVal) {
    quickLinks.value = [
      { text: 'Accueil', to: '/' },
      { text: 'Créer un groupe', to: '/create-group' },
      { text: getUserName($keycloak.tokenParsed ?? {}), to: '/profile' },
      { text: 'Déconnexion', to: '#', onClick: logout },
    ]
  }
}, { immediate: true })
</script>

<template>
  <DsfrHeader
    home-to="/"
    :quick-links="quickLinks"
    logo-text="Keycloak Comu"
  />

  <div class="fr-container fr-mt-4w">
    <NuxtPage v-if="loggedIn" />
    <SnackBar />
  </div>
</template>
