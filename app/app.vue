<script setup lang="ts">
async function submit() {
  const { results } = await $fetch('/api/v1/groups/search', {
    method: 'post',
    body: { search: 'a' },
  })
  return results
}

const groups = await submit()
</script>

<template>
  <div>
    {{ groups }}
  </div>
</template>
