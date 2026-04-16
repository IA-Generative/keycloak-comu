<script setup lang="ts">
import { computed } from 'vue'
import GroupBaseInfo from '@/components/group/GroupBaseInfo.vue'
import { useGroupStore } from '@/stores/group'
import type { GroupDtoType } from '@/shared/types'
import { useAppConfig } from '@/composables/useAppConfig'

const appConfig = useAppConfig()
const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

const rootGroupPrefix = computed(() => appConfig.value.rootGroupPath)

</script>

<template>
  <div class="flex flex-col gap-6 grow">
    <div class="flex justify-between items-center">
      <h2 class="fr-mb-0">
        <span class="path-prefix" title="Groupe racine">{{ rootGroupPrefix }}</span><span title="Nom du groupe">{{
          group.name }}</span>
      </h2>
    </div>
    <GroupBaseInfo />
  </div>
</template>
