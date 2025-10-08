import prom from 'prom-client'
import * as repo from '../repository/metrics.js'

const groupCountGauge = new prom.Gauge({
  name: 'group_count',
  help: 'Total number of groups',
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
  name: 'email_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['status'] as const,
})

function assignGaugePrometheusMetrics<T extends string>(metric: prom.Gauge<T>, values: Promise<number>, labelNames?: Record<T, string>): void {
  values.then((resolvedValues) => {
    const values = resolvedValues
    if (labelNames) {
      metric.set(labelNames, values)
      return
    }
    metric.set(values)
  })
}

function assignHistoPrometheusMetrics<T extends string>(metric: prom.Histogram<T>, values: Promise<number[]>, labelNames?: Record<T, string>): void {
  values.then((resolvedValues) => {
    const values = resolvedValues
    for (const value of values) {
      if (labelNames) {
        metric.observe(labelNames, value)
        continue
      }
      metric.observe(value)
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
