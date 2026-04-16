<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import DangerZone from '@/components/group/DangerZone.vue'
import GroupSettings from '@/components/group/GroupSettings.vue'

const props = defineProps<{
  myLevel: number
}>()

const router = useRouter()

watch(() => props.myLevel, (newLevel) => {
  if (newLevel < 20) {
    router.push('base')
  }
}, { immediate: true })
</script>

<template>
  <div>
    <GroupSettings />
    <DangerZone />
  </div>
</template>
