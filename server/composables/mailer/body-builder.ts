import type { GroupDetails } from '~~/server/repository/groups.js'

const runtimeConfig = useRuntimeConfig()
export function generateGroupInviteEmail(group: GroupDetails): string {
  const groupLink = `${runtimeConfig.baseUrl.replace(/\/$/, '')}/g/${group.id}`

  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Invitation au groupe ${group.name}</title>
    </head>
    <body style="font-family: Arial, 'Marianne', sans-serif; color: #161616; background-color: #f6f6f6; padding: 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #000091; color: #fff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Invitation à rejoindre un groupe</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.5;">Bonjour,</p>
            <p style="font-size: 16px; line-height: 1.5;">
              Vous avez été invité à rejoindre le groupe 
              <strong style="color: #000091;">${group.name}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5;">Pour accéder au groupe, cliquez sur le bouton ci-dessous :</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${groupLink}" 
                 style="display: inline-block; background-color: #000091; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">
                Rejoindre le groupe
              </a>
            </p>
            <p style="font-size: 14px; line-height: 1.5; color: #666;">
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
              <a href="${groupLink}" style="color: #000091;">${groupLink}</a>
            </p>
            <p style="font-size: 16px; line-height: 1.5;">Bien cordialement,<br/>L’équipe</p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}
