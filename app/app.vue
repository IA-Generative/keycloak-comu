<script setup lang="ts">
async function submit() {
  const { body } = await $fetch('/api/v1/user', {
    method: 'post',
    body: { name: capitalize('john') },
  })
  return body.status
}

const status = await submit()
</script>

<template>
  <div>
    {{ status }}
  </div>
</template>
