<script setup lang="ts">
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
    <h1>Profile</h1>
    <div v-if="userProfile">
      <p><strong>Username:</strong> {{ userProfile.username }}</p>
      <p><strong>Email:</strong> {{ userProfile.email }}</p>
      <p><strong>First Name:</strong> {{ userProfile.firstName }}</p>
      <p><strong>Last Name:</strong> {{ userProfile.lastName }}</p>
    </div>
  </div>
</template>
