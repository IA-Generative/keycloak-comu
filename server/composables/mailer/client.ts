import nodemailer from 'nodemailer'

const runtimeConfig = useRuntimeConfig()

const smtpClient = nodemailer.createTransport({
  host: runtimeConfig.smtpHost,
  port: Number(runtimeConfig.smtpPort),
})

export async function sendMail({ to, subject, text, html }: { to: string, subject: string, text?: string, html: string }) {
  await smtpClient.sendMail({
    from: runtimeConfig.smtpFrom,
    to,
    subject,
    text,
    html,
  })
}
