<script setup lang="ts">
import GroupBaseInfo from '~/components/group/GroupBaseInfo.vue'

const config = useRuntimeConfig()

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

const rootGroupPrefix = config.public.keycloak.rootGroupPath.endsWith('/')
  ? config.public.keycloak.rootGroupPath
  : `${config.public.keycloak.rootGroupPath}/`
</script>

<template>
  <div
    class="flex flex-col gap-6 grow"
  >
    <div class="flex justify-between items-center">
      <h2 class="fr-mb-0">
        <span
          class="path-prefix"
          title="Groupe racine"
        >{{ rootGroupPrefix }}</span>
        <span title="Nom du groupe">{{ group.name }}</span>
      </h2>
    </div>
    <GroupBaseInfo />
  </div>
</template>

<style scoped>
.path-prefix {
  opacity: 0.6;
}
</style>
