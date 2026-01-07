# keycloak-comu

![Version: 0.1.24](https://img.shields.io/badge/Version-0.1.24-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.10.0](https://img.shields.io/badge/AppVersion-0.10.0-informational?style=flat-square)

A Helm chart for Kubernetes

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
| autoscaling.enabled | bool | `false` |  |
| autoscaling.maxReplicas | int | `100` |  |
| autoscaling.minReplicas | int | `1` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| baseUrl | string | `""` |  |
| environment | string | `"production"` |  |
| extraResources | object | `{}` | Extra Kubernetes resources to be deployed along with the release. expressed as a map of YAML documents to be merged |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.registry | string | `"ghcr.io"` |  |
| image.repository | string | `"ia-generative/keycloak-comu"` |  |
| image.tag | string | `""` |  |
| imagePullSecrets | list | `[]` |  |
| ingress.annotations | object | `{}` |  |
| ingress.className | string | `""` |  |
| ingress.enabled | bool | `false` |  |
| ingress.hosts[0].host | string | `"chart-example.local"` |  |
| ingress.hosts[0].paths[0].path | string | `"/"` |  |
| ingress.hosts[0].paths[0].pathType | string | `"ImplementationSpecific"` |  |
| ingress.tls | list | `[]` |  |
| instanceId | string | `""` |  |
| keycloak.adminPassword.valueFrom.secretKeyRef.key | string | `"admin-password"` |  |
| keycloak.adminPassword.valueFrom.secretKeyRef.name | string | `""` |  |
| keycloak.adminRealm | string | `""` |  |
| keycloak.adminUser.valueFrom.secretKeyRef.key | string | `"admin-user"` |  |
| keycloak.adminUser.valueFrom.secretKeyRef.name | string | `""` |  |
| keycloak.clientId | string | `""` |  |
| keycloak.internalUrl | string | `""` |  |
| keycloak.realm | string | `""` |  |
| keycloak.rootGroupPath | string | `""` |  |
| keycloak.url | string | `""` |  |
| livenessProbe.httpGet.path | string | `"/"` |  |
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
| readinessProbe.httpGet.path | string | `"/"` |  |
| readinessProbe.httpGet.port | string | `"http"` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| revisionHistoryLimit | int | `5` |  |
| securityContext | object | `{}` |  |
| service.port | int | `8080` |  |
| service.type | string | `"ClusterIP"` |  |
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.automount | bool | `true` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.name | string | `""` |  |
| smtp.enable | bool | `false` |  |
| smtp.from | string | `"no-reply@keycloak.comu"` |  |
| smtp.host | string | `""` |  |
| smtp.pass.valueFrom.secretKeyRef.key | string | `"password"` |  |
| smtp.pass.valueFrom.secretKeyRef.name | string | `""` |  |
| smtp.port | int | `25` |  |
| smtp.secure | bool | `true` |  |
| smtp.user.valueFrom.secretKeyRef.key | string | `"username"` |  |
| smtp.user.valueFrom.secretKeyRef.name | string | `""` |  |
| tolerations | list | `[]` |  |
| volumeMounts | list | `[]` |  |
| volumes | list | `[]` |  |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
