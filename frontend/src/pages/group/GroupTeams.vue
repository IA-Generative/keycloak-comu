<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import TeamManager from '@/components/group/TeamManager.vue'

const props = defineProps<{
  myLevel: number
}>()

const router = useRouter()

watch(() => props.myLevel, (newLevel) => {
  if (newLevel < 10) {
    router.push('base')
  }
}, { immediate: true })
</script>

<template>
  <TeamManager />
</template>
