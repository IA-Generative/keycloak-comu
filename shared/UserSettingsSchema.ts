import { z } from 'zod'

export const UserSettingsSchema = z.object({
  autoAcceptInvites: z.boolean().nullable(),
})

export default UserSettingsSchema
