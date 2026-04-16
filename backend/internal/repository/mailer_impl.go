package repository

import (
	"context"
	"fmt"
	"html"
	"strings"
	"time"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/config"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/ports"
	"go.uber.org/zap"
	"gopkg.in/gomail.v2"
)

type smtpMailer struct {
	dialer  *gomail.Dialer
	from    string
	baseURL string
	enabled bool
	logger  *zap.Logger
	metrics ports.MetricsRecorder
}

func NewMailer(cfg config.SMTPConfig, logger *zap.Logger, metrics ports.MetricsRecorder) ports.Mailer {
	d := gomail.NewDialer(cfg.Host, cfg.Port, cfg.Username, cfg.Password)
	return &smtpMailer{
		dialer:  d,
		from:    cfg.From,
		baseURL: strings.TrimRight(cfg.BaseURL, "/"),
		enabled: cfg.Enabled,
		logger:  logger,
		metrics: metrics,
	}
}

func (m *smtpMailer) send(to, subject, htmlBody string) error {
	if !m.enabled {
		m.metrics.ObserveEmailSent("disabled")
		return nil
	}

	msg := gomail.NewMessage()
	msg.SetHeader("From", m.from)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/html", htmlBody)

	if err := m.dialer.DialAndSend(msg); err != nil {
		m.logger.Error("failed to send email", zap.String("to", to), zap.Error(err))
		m.metrics.ObserveEmailSent("failed")
		return fmt.Errorf("send email: %w", err)
	}
	m.logger.Info("email sent", zap.String("to", to), zap.String("subject", subject))
	m.metrics.ObserveEmailSent("sent")
	return nil
}

func (m *smtpMailer) groupLink(groupID string) string {
	return m.baseURL + "/g/" + groupID
}

// ── Email builders ─────────────────────────────────────────────────────────

func (m *smtpMailer) SendGroupInvite(_ context.Context, toEmail, toName, groupID, groupName string) error {
	link := m.groupLink(groupID)
	subject := fmt.Sprintf("Vous avez été invité à rejoindre le groupe %s", groupName)
	body := emailLayout("Invitation à rejoindre un groupe", "#000091", fmt.Sprintf(`
		<p style="font-size:16px;line-height:1.5;">Bonjour %s,</p>
		<p style="font-size:16px;line-height:1.5;">
			Vous avez été invité à rejoindre le groupe
			<strong style="color:#000091;">%s</strong>.
		</p>
		<p style="font-size:16px;line-height:1.5;">Pour accéder au groupe, cliquez sur le bouton ci-dessous :</p>
		%s
		%s
		<p style="font-size:16px;line-height:1.5;">Bien cordialement,<br/>L'équipe</p>`,
		html.EscapeString(toName),
		html.EscapeString(groupName),
		ctaButton("Rejoindre le groupe", link),
		fallbackLink(link),
	))
	return m.send(toEmail, subject, body)
}

func (m *smtpMailer) SendAutoJoinNotification(_ context.Context, toEmail, toFirstName, groupID, groupName string) error {
	link := m.groupLink(groupID)
	profileLink := m.baseURL + "/profile"
	subject := fmt.Sprintf("Vous avez été ajouté au groupe %s", groupName)
	body := emailLayout("Vous avez été ajouté à un groupe", "#000091", fmt.Sprintf(`
		<p style="font-size:16px;line-height:1.5;">Bonjour %s,</p>
		<p style="font-size:16px;line-height:1.5;">
			Vous avez été automatiquement ajouté au groupe
			<strong style="color:#000091;">%s</strong>.
		</p>
		<p style="font-size:16px;line-height:1.5;">
			Vous pouvez dès à présent accéder au groupe via le lien ci-dessous :
		</p>
		%s
		%s
		<p style="font-size:16px;line-height:1.5;">Bien cordialement,<br/>L'équipe</p>
		<p style="font-size:14px;line-height:1.5;color:#666;">
			Cette action a été effectuée conformément aux paramètres de votre compte.
			Si vous souhaitez modifier cette préférence, vous pouvez modifier
			<a href="%s" style="color:#000091;">vos paramètres</a>
		</p>`,
		html.EscapeString(toFirstName),
		html.EscapeString(groupName),
		ctaButton("Accéder au groupe", link),
		fallbackLink(link),
		profileLink,
	))
	return m.send(toEmail, subject, body)
}

func (m *smtpMailer) SendJoinRequest(_ context.Context, toEmail, groupID, groupName, requesterName string) error {
	link := m.groupLink(groupID)
	subject := fmt.Sprintf("Nouvelle demande pour rejoindre le groupe %s", groupName)
	body := emailLayout("Nouvelle demande d'adhésion", "#000091", fmt.Sprintf(`
		<p style="font-size:16px;line-height:1.5;">Bonjour,</p>
		<p style="font-size:16px;line-height:1.5;">
			L'utilisateur <strong style="color:#000091;">%s</strong> souhaite rejoindre le groupe
			<strong style="color:#000091;">%s</strong>.
		</p>
		<p style="font-size:16px;line-height:1.5;">Vous pouvez gérer cette demande en accédant au groupe :</p>
		%s
		%s
		<p style="font-size:16px;line-height:1.5;">Bien cordialement,<br/>L'équipe</p>`,
		html.EscapeString(requesterName),
		html.EscapeString(groupName),
		ctaButton("Gérer la demande", link),
		fallbackLink(link),
	))
	return m.send(toEmail, subject, body)
}

func (m *smtpMailer) SendJoinValidation(_ context.Context, toEmail, groupID, groupName string) error {
	link := m.groupLink(groupID)
	subject := fmt.Sprintf("Votre demande pour rejoindre le groupe %s a été acceptée", groupName)
	body := emailLayout("Demande validée", "#008941", fmt.Sprintf(`
		<p style="font-size:16px;line-height:1.5;">Bonjour,</p>
		<p style="font-size:16px;line-height:1.5;">
			Votre demande pour rejoindre le groupe
			<strong style="color:#000091;">%s</strong> a été validée.
		</p>
		<p style="font-size:16px;line-height:1.5;">Vous pouvez dès maintenant accéder au groupe :</p>
		%s
		%s
		<p style="font-size:16px;line-height:1.5;">Bienvenue à bord,<br/>L'équipe</p>`,
		html.EscapeString(groupName),
		ctaButton("Accéder au groupe", link),
		fallbackLink(link),
	))
	return m.send(toEmail, subject, body)
}

func (m *smtpMailer) SendTOSUpdate(_ context.Context, toEmail, groupID, groupName string) error {
	link := m.groupLink(groupID)
	date := time.Now().Format("02/01/2006")
	subject := fmt.Sprintf("Les conditions d'utilisation du groupe %s ont été mises à jour", groupName)
	body := emailLayout("Mise à jour des conditions d'utilisation", "#000091", fmt.Sprintf(`
		<p style="font-size:16px;line-height:1.5;">Bonjour,</p>
		<p style="font-size:16px;line-height:1.5;">
			Les <strong>conditions générales d'utilisation</strong> du groupe %s ont été mises à jour le
			<strong>%s</strong>.
		</p>
		<p style="font-size:16px;line-height:1.5;">
			Vous pouvez consulter la nouvelle version en cliquant sur le bouton ci-dessous :
		</p>
		%s
		<p style="font-size:16px;line-height:1.5;">
			Aucune action n'est requise de votre part. Ces changements prennent effet automatiquement.
		</p>
		%s
		<p style="font-size:16px;line-height:1.5;">Bien cordialement,<br/>L'équipe</p>`,
		html.EscapeString(groupName),
		date,
		ctaButton("Consulter les conditions", link),
		fallbackLink(link),
	))
	return m.send(toEmail, subject, body)
}

// ── HTML helpers ───────────────────────────────────────────────────────────

func emailLayout(title, bannerColor, content string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>%s</title></head>
<body style="font-family:Arial,'Marianne',sans-serif;color:#161616;background-color:#f6f6f6;padding:24px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #ddd;">
  <tr><td style="padding:20px;text-align:center;background-color:%s;color:#fff;">
    <h1 style="margin:0;font-size:22px;font-weight:700;">%s</h1>
  </td></tr>
  <tr><td style="padding:24px;">%s</td></tr>
</table>
</body>
</html>`, html.EscapeString(title), bannerColor, html.EscapeString(title), content)
}

func ctaButton(label, href string) string {
	return fmt.Sprintf(`<p style="text-align:center;margin:32px 0;">
  <a href="%s" style="display:inline-block;background-color:#000091;color:#fff;text-decoration:none;padding:14px 24px;border-radius:4px;font-weight:bold;font-size:16px;">%s</a>
</p>`, href, html.EscapeString(label))
}

func fallbackLink(href string) string {
	return fmt.Sprintf(`<p style="font-size:14px;line-height:1.5;color:#666;">
  Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
  <a href="%s" style="color:#000091;">%s</a>
</p>`, href, href)
}
