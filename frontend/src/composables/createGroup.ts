import type { useRouter } from 'vue-router'
import * as backend from '@/composables/useBackend'

const createGroup = async function (groupName: string, router: ReturnType<typeof useRouter>) {
  const group = await backend.createGroup(groupName)
  router.push(`/g/${group.id}`)
}

export default createGroup
