import nodemailer from 'nodemailer'

const runtimeConfig = useRuntimeConfig()

const smtpClient = nodemailer.createTransport({
  host: runtimeConfig.smtp.host,
  port: Number(runtimeConfig.smtp.port),
})

export async function sendMail({ to, subject, text, html }: { to: string | string[], subject: string, text?: string, html: string }) {
  if (!runtimeConfig.enableEmailInvite) {
    return
  }
  await smtpClient.sendMail({
    from: runtimeConfig.smtp.from,
    to,
    subject,
    text,
    html,
  })
}
