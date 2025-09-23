<script setup lang="ts">
import { DsfrButton, DsfrFieldset, DsfrInput } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'

const groupName = ref('')

async function createGroup() {
  const { $keycloak, $router } = useNuxtApp()

  const group = await $fetch('/api/v1/groups/create', {
    method: 'post',
    body: { name: groupName.value },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })

  $router.push(`/g/${group.id}`)
}
</script>

<template>
  <div>
    <h1>Créer un groupe</h1>
    <form @submit.prevent="createGroup">
      <DsfrFieldset legend="Informations sur le groupe">
        <DsfrInput
          id="name"
          placeholder="Mon super groupe"
          label="Nom du groupe"
          v-model="groupName"
          required
        />
        <DsfrButton type="submit" class="fr-mt-2w">
          Créer
        </DsfrButton>
      </DsfrFieldset>
    </form>
  </div>
</template>
