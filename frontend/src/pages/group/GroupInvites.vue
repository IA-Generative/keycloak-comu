<script setup lang="ts">
import PredefinedInviteLinksSection from '@/components/group/invite-links/PredefinedInviteLinksSection.vue';
import { useGroupStore } from '@/stores/group';
import { computed } from 'vue';

const groupStore = useGroupStore()
const mylevel = computed(() => groupStore.mylevel)
</script>

<template>
  <PredefinedInviteLinksSection v-if="mylevel >= 20" />
</template>
