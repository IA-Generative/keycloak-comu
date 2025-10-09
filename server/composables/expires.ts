import { generateGroupExpirationEmailDSFR } from './mailer/body-builder.js'
import { sendMail } from './mailer/client.js'
import * as repo from '../repository/groups.js'

export async function noticeGroupExpiringInLessThan(days: number) {
  console.log(`Checking for groups expiring in less than ${days} days...`)

  const before = String(new Date(Date.now() + days * 24 * 60 * 60 * 1000).valueOf())
  const expiringGroups = await repo.getExpiringGroups(before)

  for (const group of expiringGroups) {
    const groupDetails = await repo.getGroupDetails(group.id)
    if (!groupDetails) {
      continue
    }
    const body = generateGroupExpirationEmailDSFR(groupDetails, group.value || 'unknown')
    const recipients = groupDetails.members
      .filter(m => groupDetails.attributes.owner.includes(m.id) || groupDetails.attributes.admin.includes(m.id))
      .map(m => m.email)
      .filter(email => !!email)
    if (recipients.length === 0) {
      continue
    }
    const result = await sendMail({
      to: recipients,
      subject: `Votre groupe "${groupDetails.name}" expire dans moins de ${days} jours`,
      html: body,
    }).catch((err) => {
      console.error(`Failed to send expiration email to group ${group.id} owners`, err)
    })
    if (result === 'sent') {
      repo.setExpiringMailSent(group.id)
    }
  }
}
