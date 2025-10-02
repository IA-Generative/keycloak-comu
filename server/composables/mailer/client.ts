import nodemailer from 'nodemailer'

const { smtp } = useRuntimeConfig()

const smtpClient = nodemailer.createTransport({
  host: smtp.host,
  port: Number(smtp.port),
})

export async function sendMail({ to, subject, text, html }: { to: string | string[], subject: string, text?: string, html: string }) {
  if (!smtp.enable) {
    return
  }
  await smtpClient.sendMail({
    from: smtp.from,
    to,
    subject,
    text,
    html,
  })
}
