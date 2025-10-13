{{/*
Expand the name of the chart.
*/}}
{{- define "keycloak-comu.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
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

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "keycloak-comu.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "keycloak-comu.labels" -}}
helm.sh/chart: {{ include "keycloak-comu.chart" . }}
{{ include "keycloak-comu.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "keycloak-comu.selectorLabels" -}}
app.kubernetes.io/name: {{ include "keycloak-comu.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "keycloak-comu.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "keycloak-comu.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create NODE_ENV var
*/}}
{{- define "keycloak-comu.env" -}}
{{- if .Values.environment -}}
- name: NODE_ENV
  value: {{ .Values.environment }}
{{- end -}}
{{- end -}}

{{/*
Create BASE_URL var
*/}}
{{- define "keycloak-comu.baseUrl" -}}
{{- if .Values.baseUrl -}}
- name: NUXT_BASE_URL
  value: {{ .Values.baseUrl }}
{{- end }}
{{- end }}

{{/* KEYCLOAK Settings */}}
{{- define "keycloak-comu.keycloakSettings" -}}
- name: NUXT_PUBLIC_KEYCLOAK_URL
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.url }}
{{- if .Values.keycloak.internalUrl }}
- name: NUXT_KEYCLOAK_INTERNAL_URL
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.internalUrl }}
{{- end }}
- name: NUXT_PUBLIC_KEYCLOAK_REALM
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.realm }}
- name: NUXT_PUBLIC_KEYCLOAK_CLIENT_ID
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.clientId }}
{{- if .Values.keycloak.rootGroupPath }}
- name: NUXT_PUBLIC_KEYCLOAK_ROOT_GROUP_PATH
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.rootGroupPath }}
{{- end }}
- name: NUXT_KEYCLOAK_ADMIN_USERNAME
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.adminUser }}
- name: NUXT_KEYCLOAK_ADMIN_PASSWORD
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.adminPassword }}
{{- if .Values.keycloak.adminRealm }}
- name: NUXT_KEYCLOAK_ADMIN_REALM
  {{- include "keycloak-comu.valueHandler" .Values.keycloak.adminRealm }}
{{- end -}}
{{- end -}}

{{/* SMTP Settings */}}
{{- define "keycloak-comu.smtpSettings" -}}
{{- if .Values.smtp.enable }}
- name: NUXT_SMTP_ENABLE
  value: "true"
- name: NUXT_SMTP_HOST
  {{- include "keycloak-comu.valueHandler" .Values.smtp.host }}
- name: NUXT_SMTP_PORT
  {{- include "keycloak-comu.valueHandler" .Values.smtp.port }}
- name: NUXT_SMTP_FROM
  {{- include "keycloak-comu.valueHandler" .Values.smtp.from }}
{{- if .Values.smtp.user }}
- name: NUXT_SMTP_USER
  {{- include "keycloak-comu.valueHandler" .Values.smtp.user }}
{{- end -}}
{{- if .Values.smtp.pass }}
- name: NUXT_SMTP_PASS
  {{- include "keycloak-comu.valueHandler" .Values.smtp.pass }}
{{- end -}}
{{- if .Values.smtp.secure }}
- name: NUXT_SMTP_SECURE
  {{- include "keycloak-comu.valueHandler" .Values.smtp.secure }}
{{- end -}}
{{- end -}}
{{- end -}}

{{/* Postgres Settings */}}
{{- define "keycloak-comu.postgresSettings" -}}
- name: NUXT_DATABASE_HOST
  {{- include "keycloak-comu.valueHandler" .Values.postgres.host }}
- name: NUXT_DATABASE_PORT
  {{- include "keycloak-comu.valueHandler" .Values.postgres.port }}
- name: NUXT_DATABASE_NAME
  {{- include "keycloak-comu.valueHandler" .Values.postgres.database }}
- name: NUXT_DATABASE_USER
  {{- include "keycloak-comu.valueHandler" .Values.postgres.user }}
- name: NUXT_DATABASE_PASSWORD
  {{- include "keycloak-comu.valueHandler" .Values.postgres.password }}
{{- end -}}

{{/* General Settings */}}
{{- define "keycloak-comu.generalSettings" -}}
- name: NUXT_INSTANCE_ID
  {{- include "keycloak-comu.valueHandler" (.Values.instanceId | default .Chart.Name) }}
{{- end -}}

{{/* Values handler */}}
{{- define "keycloak-comu.valueHandler" -}}
{{- if kindIs "string" . }}
  value: {{ . | quote }}
{{- else if kindIs "bool" . }}
  value: {{ . | quote }}
{{- else if kindIs "float64" . }}
  value: {{ . | quote }}
{{- else }}
  {{- toYaml . | nindent 2 }}
{{- end -}}
{{- end -}}

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