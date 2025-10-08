import nodemailer from 'nodemailer'
import { emailSentGauge } from '~~/server/plugins/metrics.js'

const { smtp } = useRuntimeConfig()

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
    emailSentGauge.inc({ status: 'sent' })
    return 'sent'
  } catch (error) {
    console.error('Error sending email:', error)
    emailSentGauge.inc({ status: 'failed' })
    return 'sendFailed'
  }
}
