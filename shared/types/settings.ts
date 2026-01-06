import { z } from 'zod'

export type SettingsValues = boolean | null
export interface Settings {
  autoAcceptInvites: SettingsValues
}

export const UserSettingsSchema = z.object({
  autoAcceptInvites: z.boolean().optional(),
})