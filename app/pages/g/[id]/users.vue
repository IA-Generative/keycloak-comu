<script setup lang="ts">
import MembersTable from '~/components/group/MembersTable.vue'
import InvitesList from '~/components/group/InvitesList.vue'
import InviteMember from '~/components/group/InviteMember.vue'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)
const mylevel = computed(() => groupStore.mylevel)
</script>

<template>
  <div>
    <div class="flex flex-col xl:flex-col">
      <MembersTable />
    </div>
    <div
      v-if="[0, 20, 30].includes(mylevel)"
      class="flex lg:flex-row flex-col gap-16"
    >
      <!-- Formulaire d'ajout de membre -->
      <div
        v-if="mylevel >= 20"
        class="grow"
      >
        <InviteMember
          :group-id="group.id"
        />
      </div>
      <div class="grow">
        <InvitesList
          v-if="mylevel >= 20"
        />
      </div>
    </div>
  </div>
</template>
