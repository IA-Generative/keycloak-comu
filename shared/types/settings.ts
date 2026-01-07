import { z } from 'zod'
import type UserSettingsSchema from '../UserSettingsSchema.js'
import type GroupSettingsDtoSchema from '../GroupSettingsSchema.js'

export type SettingsValues = boolean | null
export type UserSettings = z.infer<typeof UserSettingsSchema>
export type GroupSettings = z.infer<typeof GroupSettingsDtoSchema>

