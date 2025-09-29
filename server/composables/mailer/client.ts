import nodemailer from 'nodemailer'

const runtimeConfig = useRuntimeConfig()

const smtpClient = nodemailer.createTransport({
  host: runtimeConfig.smtpHost,
  port: Number(runtimeConfig.smtpPort),
})

export async function sendMail({ to, subject, text, html }: { to: string | string[], subject: string, text?: string, html: string }) {
  if (!runtimeConfig.enableEmailInvite) {
    return
  }
  await smtpClient.sendMail({
    from: runtimeConfig.smtpFrom,
    to,
    subject,
    text,
    html,
  })
}
