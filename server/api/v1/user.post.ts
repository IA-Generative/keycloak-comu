export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log('Creating user:', body.name)
  return {
    body: {
      status: `User ${lowerize(body.name)} created`,
    },
  }
})
