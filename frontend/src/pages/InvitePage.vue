<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DsfrAlert } from '@gouvminint/vue-dsfr'
import { acceptInviteByCode, previewPredefinedInvite } from '@/composables/useBackend'
import { addMessage } from '@/composables/snackbarManager'
import type { PredefinedInvite } from '@/shared/types'
import InvitePreviewCard from '@/components/invite/InvitePreviewCard.vue'
import InviteRedirectCountdown from '@/components/invite/InviteRedirectCountdown.vue'
import { getCurrentUser, handleOidcCallbackIfPresent, login } from '@/composables/useOidc'

const route = useRoute()
const router = useRouter()
const code = route.params.code as string

const invite = ref<PredefinedInvite | null>(null)
const loading = ref(false)
const fetchError = ref<'not_found' | 'error' | null>(null)
const accepted = ref(false)
const redirectUrl = ref<string | null>(null)
const loggedIn = ref(false)

// Mémorise qu'une acceptation était en cours avant de partir s'authentifier.
// Sans cela, la personne revient de Keycloak sur une page identique et doit
// deviner qu'il lui faut cliquer une seconde fois.
const CLE_REPRISE = 'invitation-a-reprendre'

onMounted(async () => {
  loading.value = true
  try {
    let user = await handleOidcCallbackIfPresent()
    if (!user) {
      user = await getCurrentUser()
    }
    loggedIn.value = Boolean(user?.access_token)
  }
  catch (err) {
    console.error('Initialisation de l\'authentification impossible', err)
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

  // Retour d'authentification alors qu'une acceptation était engagée : on la
  // reprend, plutôt que de laisser la personne devant le même écran.
  if (loggedIn.value && invite.value
      && sessionStorage.getItem(CLE_REPRISE) === code) {
    sessionStorage.removeItem(CLE_REPRISE)
    await accepter()
  }
})

// Sans session, l'acceptation partait sans jeton, le service répondait 401, et
// l'interface annonçait malgré tout « Invitation acceptée ». On authentifie
// d'abord ; `login()` revient sur cette même adresse.
async function onAccept() {
  if (!loggedIn.value) {
    sessionStorage.setItem(CLE_REPRISE, code)
    await login()
    return
  }
  await accepter()
}

async function accepter() {
  loading.value = true
  try {
    await acceptInviteByCode(code)
    accepted.value = true
    addMessage({ type: 'success', text: 'Invitation acceptée.' })
    if (invite.value?.redirectUrl) {
      redirectUrl.value = invite.value.redirectUrl
    }
    else {
      await router.push(`/g/${invite.value?.groupId}`)
    }
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      addMessage({ type: 'info', text: 'Vous êtes déjà membre de ce groupe.' })
      await router.push(`/g/${invite.value?.groupId}`)
    }
    else if (status === 401) {
      // La session a expiré entre l'affichage et le clic.
      loggedIn.value = false
      sessionStorage.setItem(CLE_REPRISE, code)
      addMessage({ type: 'info', text: 'Votre session a expiré, veuillez vous reconnecter.' })
      await login()
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
