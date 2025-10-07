<script setup lang="ts">
import { DsfrTable } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'

const userProfile = ref<any>(null)
onBeforeMount(async () => {
  const { $keycloak } = useNuxtApp()
  if ($keycloak?.token) {
    userProfile.value = await $keycloak.loadUserProfile()
  }
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
          <td>{{ userProfile.username }}</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>{{ userProfile.email }}</td>
        </tr>
        <tr>
          <th>Prénom</th>
          <td>{{ userProfile.firstName }}</td>
        </tr>
        <tr>
          <th>Nom</th>
          <td>{{ userProfile.lastName }}</td>
        </tr>
      </DsfrTable>
    </div>
  </div>
</template>
