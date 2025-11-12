<script setup lang="ts">
import { DsfrTable } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'

const userProfile = ref<any>(null)
onBeforeMount(async () => {
  const { $keycloak } = useNuxtApp()
  if ($keycloak?.token) {
    userProfile.value = $keycloak.tokenParsed
  }
})

useHead({
  title: `Keycloak Comu - Profil`,
})
</script>

<template>
  <div>
    <div v-if="userProfile">
      <DsfrTable
        title="Informations utilisateur"
      >
        <tr>
          <th>Nom d'utilisateur</th>
          <td>{{ userProfile.preferred_username }}</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>{{ userProfile.email }}</td>
        </tr>
        <tr>
          <th>Nom, Prénom</th>
          <td>{{ userProfile.family_name }}, {{ userProfile.given_name }}</td>
        </tr>
      </DsfrTable>
    </div>
  </div>
</template>
