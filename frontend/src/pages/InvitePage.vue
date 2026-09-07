<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DsfrAlert } from '@gouvminint/vue-dsfr'
import { acceptInviteByCode, previewPredefinedInvite } from '@/composables/useBackend'
import { addMessage } from '@/composables/snackbarManager'
import type { PredefinedInvite } from '@/shared/types'
import InvitePreviewCard from '@/components/invite/InvitePreviewCard.vue'
import InviteRedirectCountdown from '@/components/invite/InviteRedirectCountdown.vue'
import { getCurrentUser, handleOidcCallbackIfPresent, isLoggedIn, login } from '@/composables/useOidc'
import { setLocalStorage } from '@/composables/useLocalStorage'
import type { User } from 'oidc-client-ts'

const route = useRoute()
const router = useRouter()
const code = route.params.code as string
const ACCEPT_CHALLENGE_KEY = 'accept-challenge'

const invite = ref<PredefinedInvite | null>(null)
const loading = ref(false)
const fetchError = ref<'not_found' | 'error' | null>(null)
const accepted = ref(false)
const redirectUrl = ref<string | null>(null)
const loggedIn = ref(false)

function getAcceptChallenge(): string | null {
  return localStorage.getItem(ACCEPT_CHALLENGE_KEY)
}

function removeAcceptChallenge(): void {
  localStorage.removeItem(ACCEPT_CHALLENGE_KEY)
}

function processAcceptChallenge(): string | null {
  const challenge = getAcceptChallenge()
  removeAcceptChallenge()
  return challenge
}

async function detectAcceptChallenge(user: User | null) {
  if (!user) {
    console.log('User not logged in, removing accept challenge')
    removeAcceptChallenge()
    return
  }
  const state = (user?.state ?? null) as Record<string, unknown> | null
  const stateChallenge = state?.acceptChallenge ?? null
  console.log('State challenge from user state:', stateChallenge)
  if (!stateChallenge) {
    console.log('No accept challenge found in user state, removing local accept challenge')
    removeAcceptChallenge()
    return
  }
  const localChallenge = stateChallenge ? processAcceptChallenge() : null
  if (!localChallenge) {
    console.log('No local accept challenge found, cannot verify against state challenge')
    return
  }
  if (localChallenge === stateChallenge) {
    console.log('Accept challenge verified:', localChallenge)
    await onAccept()
  } else {
    console.warn('Accept challenge verification failed:', { stateChallenge, localChallenge })
    removeAcceptChallenge()
  }
}

onMounted(async () => {
  loading.value = true
    try {
    let user = await handleOidcCallbackIfPresent()
    if (!user) {
      user = await getCurrentUser()
      console.log('User not logged in')
    }
    if (user?.access_token) {
      loggedIn.value = true
    }
    await detectAcceptChallenge(user)
  } catch (err) {
    console.error('Auth init failed', err)
  }
  try {
    invite.value = await previewPredefinedInvite(code)
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    fetchError.value = status === 404 ? 'not_found' : 'error'
  }
  finally {
    loading.value = false
  }
})

async function onAccept() {
  loading.value = true
  try {
    if (await isLoggedIn()) {
      await acceptInviteByCode(code)
      accepted.value = true
    } else {
      const randomChallenge = Math.random().toString(36).substring(4)
      setLocalStorage(ACCEPT_CHALLENGE_KEY, randomChallenge)
      const redirectUrl = new URL(window.location.href)
      console.log({ redirectUrl: redirectUrl.toString() })
      await login({
        state: {
          acceptChallenge: localStorage.getItem(ACCEPT_CHALLENGE_KEY)
        }
      })
    }
    addMessage({ type: 'success', text: 'Invitation acceptée.' })
    invite.value = await previewPredefinedInvite(code)
    if (invite.value?.redirectUrl) {
      redirectUrl.value = invite.value.redirectUrl
    }
    else {
      console.log('No redirect URL specified in the invite, defaulting to group page:', invite.value)
      await router.push(`/g/${invite.value?.groupId}`)
    }
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      addMessage({ type: 'info', text: 'Vous êtes déjà membre de ce groupe.' })
      await router.push(`/g/${invite.value?.groupId}`)
    }
    else {
      addMessage({ type: 'error', text: 'Impossible d\'accepter l\'invitation.' })
    }
  }
  finally {
    loading.value = false
  }
}

function onDecline() {
  router.push('/')
}

function onCancelRedirect() {
  redirectUrl.value = null
}
</script>

<template>
  <main v-if="loggedIn || invite" class="fr-container fr-mt-6w fr-mb-6w" style="max-width: 48rem;">

    <div v-if="loading && !invite" class="fr-py-8w flex justify-center">
      <span class="fr-text--sm fr-text-mention--grey">Chargement…</span>
    </div>

    <DsfrAlert
      v-else-if="fetchError === 'not_found'"
      type="error"
      title="Lien invalide"
      description="Ce lien d'invitation est invalide, expiré ou a déjà été utilisé."
    />

    <template v-else-if="fetchError === 'error'">

      <DsfrAlert
      type="error"
      title="Erreur"
      description="Une erreur est survenue lors du chargement de l'invitation."
      />
      <InviteRedirectCountdown
        redirect-url="/"
        title="la page d'accueil"
        @cancel="onCancelRedirect"
      />
    </template>

    <template v-else-if="invite">
      <InviteRedirectCountdown
        v-if="redirectUrl"
        :redirect-url="redirectUrl"
        @cancel="onCancelRedirect"
      />
      <InvitePreviewCard
        v-else
        :invite="invite"
        :loading="loading"
        @accept="onAccept"
        @decline="onDecline"
      />
    </template>
  </main>
</template>
