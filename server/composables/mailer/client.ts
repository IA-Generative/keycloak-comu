import nodemailer from 'nodemailer'
import { emailSentGauge } from '~~/server/composables/metrics.js'

const { smtp, version } = useRuntimeConfig()
const instanceId = process.env.HOSTNAME || crypto.randomUUID().slice(0, 6)

emailSentGauge.inc({ status: 'sent', instance_id: instanceId, version }, 0) // initialize metric
emailSentGauge.inc({ status: 'failed', instance_id: instanceId, version }, 0) // initialize metric

const smtpClient = nodemailer.createTransport({
  host: smtp.host,
  port: Number(smtp.port),
  secure: smtp.secure,
  ignoreTLS: smtp.ignoreTLS,
  auth: smtp.user || smtp.pass
    ? {
        type: smtp.authType || 'LOGIN',
        user: smtp.user,
        pass: smtp.pass,
      }
    : undefined,
})

export async function sendMail({ to, subject, text, html }: { to: string | string[], subject: string, text?: string, html: string }): Promise<'disabled' | 'sent' | 'sendFailed'> {
  if (!smtp.enable) {
    return 'disabled'
  }
  try {
    await smtpClient.sendMail({
      from: smtp.from,
      to,
      subject,
      text,
      html,
    })
    emailSentGauge.inc({ status: 'sent', instance_id: instanceId, version })
    return 'sent'
  } catch (error) {
    console.error('Error sending email:', error)
    emailSentGauge.inc({ status: 'failed', instance_id: instanceId, version })
    return 'sendFailed'
  }
}
