import { z } from 'zod'

export const safeText = z.string().min(1).transform((text) => {
  return text.replaceAll(/['";<>]/g, ' ').trim()
})
