<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import NotificationsList from '@/components/NotificationsList.vue'

const notificationsStore = useNotificationsStore()
const showPanel = ref(false)
</script>

<template>
  <div class="notif-bell-wrapper">
    <button class="nav-link notif-bell" @click="showPanel = !showPanel">
      🔔
      <span v-if="notificationsStore.notificationsLength > 0" class="notif-badge">
        {{ notificationsStore.notificationsLength }}
      </span>
    </button>
    <NotificationsList v-if="showPanel" @close="showPanel = false" />
  </div>
</template>

<style scoped>
.notif-bell-wrapper {
  position: relative;
}

.notif-bell {
  position: relative;
  cursor: pointer;
  background: none;
  border: none;
  font-size: 1.2rem;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background: #d32f2f;
  color: #fff;
  font-size: 0.7rem;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
