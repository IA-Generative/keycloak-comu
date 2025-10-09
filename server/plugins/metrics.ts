import prom from 'prom-client'
import * as repoMetrics from '../repository/metrics.js'
import { getExpiringGroups } from '../repository/groups.js'

const groupCountGauge = new prom.Gauge({
  name: 'group_count',
  help: 'Total number of groups',
  labelNames: ['type'] as const,
})

// quantile of members per group
const groupExpirationMonthHistogram = new prom.Histogram({
  name: 'group_expiration_month',
  help: 'Number of groups expiring in X Months',
  buckets: [0, 1, 2, 3, 4, 5, 6, 12],
})

const groupExpiredCount = new prom.Gauge({
  name: 'group_expired_count',
  help: 'Number of groups expired',
  labelNames: ['reason'] as const,
})
groupExpiredCount.set({ reason: 'expired' }, 0)
groupExpiredCount.set({ reason: 'no_expiration' }, 0)

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
  labelNames: ['status', 'instance_id', 'version'] as const,
})

function assignGaugePrometheusMetrics(metric: prom.Gauge<string>, values: Promise<number>, labelNames?: Record<string, string>): void {
  values.then((resolvedValues) => {
    metric.set(labelNames ?? {}, resolvedValues)
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
  assignGaugePrometheusMetrics(groupCountGauge, repoMetrics.countGroupMetrics())
  groupExpirationMonthHistogram.reset()
  assignHistoPrometheusMetrics(groupExpirationMonthHistogram, repoMetrics.countExpiringGroups())
  assignGaugePrometheusMetrics(groupExpiredCount, getExpiringGroups(String(Date.now().valueOf()), true).then(groups => groups.length), { reason: 'expired' })
  assignGaugePrometheusMetrics(groupExpiredCount, repoMetrics.countGroupWithoutExpiration(), { reason: 'no_expiration' })

  membersPerGroupHisto.reset()
  assignHistoPrometheusMetrics(membersPerGroupHisto, repoMetrics.countMembersPerGroupMetrics(), { type: 'member' })
  assignHistoPrometheusMetrics(membersPerGroupHisto, repoMetrics.countAdminsPerGroupMetrics(), { type: 'admin' })
  assignHistoPrometheusMetrics(membersPerGroupHisto, repoMetrics.countOwnersPerGroupMetrics(), { type: 'owner' })

  pendingsPerGroupHisto.reset()
  assignHistoPrometheusMetrics(pendingsPerGroupHisto, repoMetrics.countPendingRequestsPerGroupMetrics(), { type: 'request' })
  assignHistoPrometheusMetrics(pendingsPerGroupHisto, repoMetrics.countPendingInvitesPerGroupMetrics(), { type: 'invite' })
}

export default defineNitroPlugin(async () => {
  setTimeout(retrieveGroupMetrics, 10000) // Delay to allow Keycloak to start
})
