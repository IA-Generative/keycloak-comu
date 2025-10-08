import prom from 'prom-client'
import * as repo from '../repository/metrics.js'

const instanceId = process.env.HOSTNAME || crypto.randomUUID().slice(0, 6)
const config = useRuntimeConfig()
prom.register.setDefaultLabels({
  instance_id: instanceId,
  version: config.public.version,
})

const groupCountGauge = new prom.Gauge({
  name: 'group_count',
  help: 'Total number of groups',
  labelNames: ['type'] as const,
})

// quantile of members per group
const membersPerGroupHisto = new prom.Histogram({
  name: 'members_per_group',
  help: 'Average number of members per group',
  buckets: [0, 1, 5, 20, 100],
  labelNames: ['type'] as const,
})

const pendingsPerGroupHisto = new prom.Histogram({
  name: 'pendings_per_group',
  help: 'Number of pendings per group',
  buckets: [0, 1, 5, 20],
  labelNames: ['type'] as const,
})

export const emailSentGauge = new prom.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['status'] as const,
})
emailSentGauge.inc({ status: 'sent' }, 0) // initialize metric
emailSentGauge.inc({ status: 'failed' }, 0) // initialize metric

function assignGaugePrometheusMetrics(metric: prom.Gauge<string>, values: Promise<number>, labelNames?: Record<string, string>): void {
  values.then((resolvedValues) => {
    const values = resolvedValues
    metric.set(labelNames ?? {}, values)
  })
}

function assignHistoPrometheusMetrics(metric: prom.Histogram<string>, values: Promise<number[]>, labels?: Record<string, string>): void {
  values.then((resolvedValues) => {
    const values = resolvedValues
    for (const value of values) {
      metric.observe(labels ?? {}, value)
    }
  })
}

export async function retrieveGroupMetrics() {
  assignGaugePrometheusMetrics(groupCountGauge, repo.countGroupMetrics())

  membersPerGroupHisto.reset()
  assignHistoPrometheusMetrics(membersPerGroupHisto, repo.countMembersPerGroupMetrics(), { type: 'member' })
  assignHistoPrometheusMetrics(membersPerGroupHisto, repo.countAdminsPerGroupMetrics(), { type: 'admin' })
  assignHistoPrometheusMetrics(membersPerGroupHisto, repo.countOwnersPerGroupMetrics(), { type: 'owner' })

  pendingsPerGroupHisto.reset()
  assignHistoPrometheusMetrics(pendingsPerGroupHisto, repo.countPendingRequestsPerGroupMetrics(), { type: 'request' })
  assignHistoPrometheusMetrics(pendingsPerGroupHisto, repo.countPendingInvitesPerGroupMetrics(), { type: 'invite' })
}

export default defineNitroPlugin(async () => {
  setTimeout(retrieveGroupMetrics, 10000) // Delay to allow Keycloak to start
})
