# keycloak-comu

![Version: 0.1.5](https://img.shields.io/badge/Version-0.1.5-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.1.2](https://img.shields.io/badge/AppVersion-1.1.2-informational?style=flat-square)

Keycloak Community - Group management application

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| IA-Generative |  |  |

## Values

### Servicename

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| serviceMonitor.annotations | object | `{}` | Prometheus ServiceMonitor annotations. |
| serviceMonitor.enabled | bool | `true` | Enable a prometheus ServiceMonitor. |
| serviceMonitor.endpoints[0] | object | `{"honorLabels":false,"interval":"30s","metricRelabelings":[],"path":"/metrics","relabelings":[],"scheme":"","scrapeTimeout":"10s","selector":{},"tlsConfig":{}}` | Prometheus ServiceMonitor interval. |
| serviceMonitor.endpoints[0].honorLabels | bool | `false` | When true, honorLabels preserves the metric’s labels when they collide with the target’s labels. |
| serviceMonitor.endpoints[0].metricRelabelings | list | `[]` | Prometheus MetricRelabelConfigs to apply to samples before ingestion. |
| serviceMonitor.endpoints[0].path | string | `"/metrics"` | Path used by the Prometheus ServiceMonitor to scrape metrics. |
| serviceMonitor.endpoints[0].relabelings | list | `[]` | Prometheus RelabelConfigs to apply to samples before scraping. |
| serviceMonitor.endpoints[0].scheme | string | `""` | Prometheus ServiceMonitor scheme. |
| serviceMonitor.endpoints[0].scrapeTimeout | string | `"10s"` | Prometheus ServiceMonitor scrapeTimeout. If empty, Prometheus uses the global scrape timeout unless it is less than the target's scrape interval value in which the latter is used. |
| serviceMonitor.endpoints[0].selector | object | `{}` | Prometheus ServiceMonitor selector. |
| serviceMonitor.endpoints[0].tlsConfig | object | `{}` | Prometheus ServiceMonitor tlsConfig. |
| serviceMonitor.labels | object | `{}` | Prometheus ServiceMonitor labels. |

### Other Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| app.appTitle | string | `"Keycloak Community"` |  |
| app.cors.allowCredentials | bool | `false` |  |
| app.cors.allowedHeaders | string | `"Accept,Authorization,Content-Type,Origin"` |  |
| app.cors.allowedMethods | string | `"GET,POST,PUT,PATCH,DELETE,OPTIONS"` |  |
| app.cors.allowedOrigins | string | `"*"` |  |
| app.cors.maxAgeSeconds | int | `300` |  |
| app.env | string | `"production"` |  |
| app.keycloak.adminPassword.valueFrom.secretKeyRef.key | string | `"admin-password"` |  |
| app.keycloak.adminPassword.valueFrom.secretKeyRef.name | string | `""` |  |
| app.keycloak.adminRealm | string | `""` |  |
| app.keycloak.adminUsername.valueFrom.secretKeyRef.key | string | `"admin-user"` |  |
| app.keycloak.adminUsername.valueFrom.secretKeyRef.name | string | `""` |  |
| app.keycloak.internalUrl | string | `""` |  |
| app.keycloak.realm | string | `""` |  |
| app.keycloak.rootGroupPath | string | `""` |  |
| app.keycloak.url | string | `""` |  |
| app.oidc.clientId | string | `"keycloak-comu"` |  |
| app.oidc.issuerUrl | string | `"http://localhost:8081/realms/mirai"` |  |
| app.oidc.jwksUrl | string | `"http://localhost:8081/realms/mirai/protocol/openid-connect/certs"` |  |
| app.oidc.swaggerClientId | string | `"keycloak-comu-swagger"` |  |
| app.port | string | `"8080"` |  |
| app.publicUrl | string | `""` |  |
| app.smtp.enabled | bool | `false` |  |
| app.smtp.existingSecret | object | `{}` |  |
| app.smtp.from | string | `"no-reply@keycloak.comu"` |  |
| app.smtp.host | string | `""` |  |
| app.smtp.password.valueFrom.secretKeyRef.key | string | `"password"` |  |
| app.smtp.password.valueFrom.secretKeyRef.name | string | `""` |  |
| app.smtp.port | int | `25` |  |
| app.smtp.username.valueFrom.secretKeyRef.key | string | `"username"` |  |
| app.smtp.username.valueFrom.secretKeyRef.name | string | `""` |  |
| autoscaling.enabled | bool | `false` |  |
| autoscaling.maxReplicas | int | `5` |  |
| autoscaling.minReplicas | int | `1` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| environment | string | `"production"` |  |
| extraResources | object | `{}` | Extra Kubernetes resources to be deployed along with the release. expressed as a map of YAML documents to be merged |
| frontend.disabled | bool | `false` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"ghcr.io/ia-generative/keycloak-comu"` |  |
| image.tag | string | `""` |  |
| imagePullSecrets | list | `[]` |  |
| ingress.annotations | object | `{}` |  |
| ingress.className | string | `""` |  |
| ingress.enabled | bool | `false` |  |
| ingress.hosts[0].host | string | `"keycloak-comu.local"` |  |
| ingress.hosts[0].paths[0].path | string | `"/"` |  |
| ingress.hosts[0].paths[0].pathType | string | `"Prefix"` |  |
| ingress.tls | list | `[]` |  |
| instanceId | string | `"UNKNOWN"` |  |
| livenessProbe.httpGet.path | string | `"/healthz"` |  |
| livenessProbe.httpGet.port | string | `"http"` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podAnnotations | object | `{}` |  |
| podLabels | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| postgres.database.valueFrom.secretKeyRef.key | string | `"dbname"` |  |
| postgres.database.valueFrom.secretKeyRef.name | string | `""` |  |
| postgres.host.valueFrom.secretKeyRef.key | string | `"host"` |  |
| postgres.host.valueFrom.secretKeyRef.name | string | `""` |  |
| postgres.password.valueFrom.secretKeyRef.key | string | `"password"` |  |
| postgres.password.valueFrom.secretKeyRef.name | string | `""` |  |
| postgres.port.valueFrom.secretKeyRef.key | string | `"port"` |  |
| postgres.port.valueFrom.secretKeyRef.name | string | `""` |  |
| postgres.user.valueFrom.secretKeyRef.key | string | `"user"` |  |
| postgres.user.valueFrom.secretKeyRef.name | string | `""` |  |
| readinessProbe.httpGet.path | string | `"/readyz"` |  |
| readinessProbe.httpGet.port | string | `"http"` |  |
| replicaCount | int | `1` |  |
| resources.limits.cpu | string | `"500m"` |  |
| resources.limits.memory | string | `"256Mi"` |  |
| resources.requests.cpu | string | `"100m"` |  |
| resources.requests.memory | string | `"128Mi"` |  |
| revisionHistoryLimit | int | `5` |  |
| securityContext | object | `{}` |  |
| service.port | int | `8080` |  |
| service.type | string | `"ClusterIP"` |  |
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.automount | bool | `true` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.name | string | `""` |  |
| tolerations | list | `[]` |  |
| volumeMounts | list | `[]` |  |
| volumes | list | `[]` |  |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
