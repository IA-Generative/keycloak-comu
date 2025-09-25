import fetcher from './useApi.js'

// eslint-disable-next-line antfu/top-level-function
const createGroup = async function (groupName: string) {
  const { $router } = useNuxtApp()

  const group = await fetcher('/api/v1/groups/create', {
    method: 'post',
    body: { name: groupName },
  })

  $router.push(`/g/${group.id}`)
}

export default createGroup
