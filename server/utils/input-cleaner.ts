import { z } from 'zod'

export const safeText = z.string().transform((text) => {
  return text.replaceAll(/['";]|-{2,}%/g, ' ').trim()
})
