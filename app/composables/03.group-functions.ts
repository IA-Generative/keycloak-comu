import fetch from './01.useApi.js'

export async function createGroup(groupName: string) {
  const { $router } = useNuxtApp()

  const group = await fetch('/api/v1/groups/create', {
    method: 'post',
    body: { name: groupName },
  })

  $router.push(`/g/${group.id}`)
}
