import { z } from 'zod'

export const TeamDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  members: z.array(z.uuid()),
})

const TeamsDtoSchema = z.array(TeamDtoSchema)

export default TeamsDtoSchema
