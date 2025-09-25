import { z } from 'zod'

const MembershipLevel = z.enum([10, 20, 30].map(String)).transform(Number)

export default MembershipLevel

export type MembershipLevelType = z.infer<typeof MembershipLevel>

export const MembershipLevelNames: Record<MembershipLevelType, string> = {
  10: 'Membre',
  20: '💂 Administrateur',
  30: '👑 Propriétaire',
}
