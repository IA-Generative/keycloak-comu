import { z } from 'zod'

const GroupSettingsDtoSchema = z.object({
  autoAcceptRequests: z.boolean(),
})

export default GroupSettingsDtoSchema
