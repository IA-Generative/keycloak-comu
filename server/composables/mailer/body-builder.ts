import type { GroupDetails } from '~~/server/repository/groups.js'
import type { UserRow } from '~~/server/repository/types.js'

const runtimeConfig = useRuntimeConfig()
const baseUrl = runtimeConfig.baseUrl.replace(/\/$/, '')

export function generateGroupInviteEmail(group: GroupDetails, hostUser: UserRow): string {
  const groupLink = `${baseUrl}/g/${group.id}`

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
              ${hostUser.first_name} ${hostUser.last_name}, vous avez été invité à rejoindre le groupe 
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

export function generateAutoJoinNotificationEmail(group: GroupDetails, user: UserRow): string {
  const groupLink = `${baseUrl}/g/${group.id}`
  const profileLink = `${baseUrl}/profile`

  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Ajout automatique au groupe ${group.name}</title>
    </head>
    <body style="font-family: Arial, 'Marianne', sans-serif; color: #161616; background-color: #f6f6f6; padding: 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
             style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #000091; color: #fff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">
              Vous avez été ajouté à un groupe
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.5;">Bonjour ${user.first_name},</p>
            <p style="font-size: 16px; line-height: 1.5;">
              Vous avez été automatiquement ajouté au groupe
              <strong style="color: #000091;">${group.name}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5;">
              Vous pouvez dès à présent accéder au groupe via le lien ci-dessous :
            </p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${groupLink}"
                 style="display: inline-block; background-color: #000091; color: #fff; text-decoration: none;
                        padding: 14px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">
                Accéder au groupe
              </a>
            </p>
            <p style="font-size: 14px; line-height: 1.5; color: #666;">
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
              <a href="${groupLink}" style="color: #000091;">${groupLink}</a>
            </p>
            <p style="font-size: 16px; line-height: 1.5;">
              Bien cordialement,<br/>L’équipe
            </p>
            <p style="font-size: 14px; line-height: 1.5; color: #666;">
            Cette action a été effectuée conformément aux paramètres de votre compte. Si vous souhaitez modifier cette préférence, vous pouvez modifier <a href="${profileLink}" style="color: #000091;">vos paramètres</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

export function generateJoinRequestEmail(group: GroupDetails, user: UserRow): string {
  const groupLink = `${baseUrl}/g/${group.id}`

  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Demande d’adhésion au groupe ${group.name}</title>
    </head>
    <body style="font-family: Arial, 'Marianne', sans-serif; color: #161616; background-color: #f6f6f6; padding: 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #000091; color: #fff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Nouvelle demande d’adhésion</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.5;">Bonjour,</p>
            <p style="font-size: 16px; line-height: 1.5;">
              L’utilisateur <strong style="color: #000091;">${user.first_name} ${user.last_name}</strong> souhaite rejoindre le groupe 
              <strong style="color: #000091;">${group.name}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5;">Vous pouvez gérer cette demande en accédant au groupe :</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${groupLink}" 
                 style="display: inline-block; background-color: #000091; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">
                Gérer la demande
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

export function generateJoinValidationEmail(group: GroupDetails): string {
  const groupLink = `${baseUrl}/g/${group.id}`

  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Votre demande d’adhésion a été validée</title>
    </head>
    <body style="font-family: Arial, 'Marianne', sans-serif; color: #161616; background-color: #f6f6f6; padding: 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #008941; color: #fff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Demande validée</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.5;">Bonjour,</p>
            <p style="font-size: 16px; line-height: 1.5;">
              Votre demande pour rejoindre le groupe 
              <strong style="color: #000091;">${group.name}</strong> a été validée.
            </p>
            <p style="font-size: 16px; line-height: 1.5;">Vous pouvez dès maintenant accéder au groupe :</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${groupLink}" 
                 style="display: inline-block; background-color: #000091; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">
                Accéder au groupe
              </a>
            </p>
            <p style="font-size: 14px; line-height: 1.5; color: #666;">
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
              <a href="${groupLink}" style="color: #000091;">${groupLink}</a>
            </p>
            <p style="font-size: 16px; line-height: 1.5;">Bienvenue à bord,<br/>L’équipe</p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

interface TermsUpdateOptions {
  date: string
}

export function generateTermsUpdateEmail(group: GroupDetails, options: TermsUpdateOptions): string {
  const termsLink = `${baseUrl}/g/${group.id}`

  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Changement des conditions d’utilisation</title>
    </head>
    <body style="font-family: Arial, 'Marianne', sans-serif; color: #161616; background-color: #f6f6f6; padding: 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" 
             style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #000091; color: #fff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Mise à jour des conditions d’utilisation</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.5;">Bonjour,</p>
            <p style="font-size: 16px; line-height: 1.5;">
              Les <strong>conditions générales d’utilisation</strong> du groupe ${group.name} ont été mises à jour le 
              <strong>${options.date}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5;">
              Vous pouvez consulter la nouvelle version en cliquant sur le bouton ci-dessous :
            </p>

            <p style="text-align: center; margin: 32px 0;">
              <a href="${termsLink}"
                 style="display: inline-block; background-color: #000091; color: #fff; text-decoration: none;
                        padding: 14px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">
                Consulter les conditions
              </a>
            </p>
            <p style="font-size: 16px; line-height: 1.5;">
              Aucune action n’est requise de votre part. Ces changements prennent effet automatiquement.
            </p>
            

            <p style="font-size: 14px; line-height: 1.5; color: #666;">
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
              <a href="${termsLink}" style="color: #000091;">${termsLink}</a>
            </p>
            <p style="font-size: 16px; line-height: 1.5;">
              Bien cordialement,<br/>L’équipe
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}
