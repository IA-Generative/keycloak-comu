<script setup lang="ts">
defineProps<{
  count: number
}>()
</script>

<template>
  <div class="notification-popup" @click="$emit('click')">
    <div class="text-lg font-bold">Vous avez {{ count }} notification{{ count > 1 ? 's' : '' }}</div>
  </div>
</template>

<style scoped>
.notification-popup {
  position: relative;
  top: 0;

  background: var(--background-alt-blue-france);
  color: var(--text-action-high-blue-france);
  padding: 1rem;
  /* box-shadow: 0 0 2rem var(--background-alt-blue-france); */
  cursor: pointer;
  z-index: 1000;
  animation: fadeIn 0.5s ease-out;

  display: flex;
  align-items: center;
  justify-content: center;
}
</style>