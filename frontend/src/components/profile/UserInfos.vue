<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { DsfrTable } from '@gouvminint/vue-dsfr'
import { getCurrentUser } from '@/composables/useOidc'

const userProfile = ref<any>(null)
onBeforeMount(async () => {
  const user = await getCurrentUser()
  if (user?.profile) {
    userProfile.value = user.profile
  }
})
</script>

<template>
  <div>
    <div v-if="userProfile">
      <DsfrTable title="Informations utilisateur">
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
