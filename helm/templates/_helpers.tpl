{{- define "keycloak-comu.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "keycloak-comu.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "keycloak-comu.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "keycloak-comu.labels" -}}
helm.sh/chart: {{ include "keycloak-comu.chart" . }}
{{ include "keycloak-comu.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "keycloak-comu.selectorLabels" -}}
app.kubernetes.io/name: {{ include "keycloak-comu.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end }}

{{- define "keycloak-comu.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "keycloak-comu.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "keycloak-comu.imageTag" -}}
{{- .Values.image.tag | default .Chart.AppVersion }}
{{- end }}

{{- define "keycloak-comu.valkeyServiceName" -}}
{{- printf "%s-valkey" .Release.Name -}}
{{- end -}}

{{- define "keycloak-comu.smtpSecretName" -}}
{{- if .Values.app.smtp.existingSecret -}}
  {{- .Values.app.smtp.existingSecret.name -}}
{{- else -}}
  {{- printf "%s-smtp" (include "keycloak-comu.fullname" .) -}}
{{- end -}}
{{- end -}}

{{- define "keycloak-comu.smtpSecretPasswordKey" -}}
{{- if .Values.app.smtp.existingSecret -}}
  {{- .Values.app.smtp.existingSecret.passwordKey | default "password" -}}
{{- else -}}
  password
{{- end -}}
{{- end -}}

{{- define "keycloak-comu.valueHandler" -}}
{{- if or (kindIs "string" .) (kindIs "bool" .) (kindIs "float64" .) (kindIs "int" .) (kindIs "int64" .) }}
value: {{ . | quote }}
{{- else }}
{{- toYaml . }}
{{- end -}}
{{- end -}}

{{- define "keycloak-comu.renderEnvVar" }}
- name: {{ .name }}
{{ include "keycloak-comu.valueHandler" .value | nindent 2 }}
{{ end }}

{{- define "keycloak-comu.postgresEnvVars" }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "POSTGRES_HOST" "value" .Values.postgres.host) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "POSTGRES_PORT" "value" .Values.postgres.port) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "POSTGRES_DATABASE" "value" .Values.postgres.database) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "POSTGRES_USER" "value" .Values.postgres.user) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "POSTGRES_PASSWORD" "value" .Values.postgres.password) }}
{{ end }}

{{- define "keycloak-comu.appEnvVars" }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "ENV" "value" .Values.app.env) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "PORT" "value" .Values.app.port) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "PUBLIC_URL" "value" .Values.app.publicUrl) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "APP_TITLE" "value" .Values.app.appTitle) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "FRONTEND_DISABLED" "value" .Values.frontend.disabled) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "INSTANCE_ID" "value" .Values.instanceId) }}

{{ include "keycloak-comu.renderEnvVar" (dict "name" "OIDC_ISSUER_URL" "value" .Values.app.oidc.issuerUrl) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "OIDC_JWKS_URL" "value" .Values.app.oidc.jwksUrl) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "OIDC_CLIENT_ID" "value" .Values.app.oidc.clientId) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "OIDC_SWAGGER_CLIENT_ID" "value" .Values.app.oidc.swaggerClientId) }}

{{ include "keycloak-comu.renderEnvVar" (dict "name" "KEYCLOAK_URL" "value" .Values.app.keycloak.url) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "KEYCLOAK_INTERNAL_URL" "value" .Values.app.keycloak.internalUrl) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "KEYCLOAK_REALM" "value" .Values.app.keycloak.realm) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "KEYCLOAK_ADMIN_REALM" "value" .Values.app.keycloak.adminRealm) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "KEYCLOAK_ADMIN_USERNAME" "value" .Values.app.keycloak.adminUsername) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "KEYCLOAK_ADMIN_PASSWORD" "value" .Values.app.keycloak.adminPassword) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "KEYCLOAK_ROOT_GROUP_PATH" "value" .Values.app.keycloak.rootGroupPath) }}

{{ include "keycloak-comu.renderEnvVar" (dict "name" "CORS_ALLOWED_ORIGINS" "value" .Values.app.cors.allowedOrigins) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "CORS_ALLOWED_METHODS" "value" .Values.app.cors.allowedMethods) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "CORS_ALLOWED_HEADERS" "value" .Values.app.cors.allowedHeaders) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "CORS_ALLOW_CREDENTIALS" "value" .Values.app.cors.allowCredentials) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "CORS_MAX_AGE_SECONDS" "value" .Values.app.cors.maxAgeSeconds) }}

{{ include "keycloak-comu.renderEnvVar" (dict "name" "SMTP_ENABLED" "value" .Values.app.smtp.enabled) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "SMTP_HOST" "value" .Values.app.smtp.host) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "SMTP_PORT" "value" .Values.app.smtp.port) }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "SMTP_FROM" "value" .Values.app.smtp.from) }}
{{- if .Values.app.smtp.username }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "SMTP_USERNAME" "value" .Values.app.smtp.username) }}
{{- end }}
{{- if .Values.app.smtp.password }}
{{ include "keycloak-comu.renderEnvVar" (dict "name" "SMTP_PASSWORD" "value" .Values.app.smtp.password) }}
{{- else if .Values.app.smtp.existingSecret }}
- name: SMTP_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "keycloak-comu.smtpSecretName" . }}
      key: {{ include "keycloak-comu.smtpSecretPasswordKey" . }}
{{- end }}
{{ end }}

{{- define "common.tplvalues.render" -}}
{{- $value := typeIs "string" .value | ternary .value (.value | toYaml) }}
{{- if contains "{{" (toJson .value) }}
  {{- if .scope }}
      {{- tpl (cat "{{- with $.RelativeScope -}}" $value "{{- end }}") (merge (dict "RelativeScope" .scope) .context) }}
  {{- else }}
    {{- tpl $value .context }}
  {{- end }}
{{- else }}
    {{- $value }}
{{- end }}
{{- end -}}