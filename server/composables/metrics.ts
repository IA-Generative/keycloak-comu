import prom from 'prom-client'
import * as repoMetrics from '../repository/metrics.js'

const config = useRuntimeConfig()

prom.register.setDefaultLabels({
  instanceId: config.instanceId,
  version: config.public.version ?? 'unknown',
})

const groupCountGauge = new prom.Gauge({
  name: 'group_count',
  help: 'Total number of groups',
  labelNames: ['type'] as const,
})

// quantile of members per group
const membersPerGroupHisto = new prom.Histogram({
  name: 'members_per_group',
  help: 'Number of members per group',
  buckets: [0, 1, 5, 20, 100],
  labelNames: ['type'] as const,
})

const pendingsPerGroupHisto = new prom.Histogram({
  name: 'pendings_per_group',
  help: 'Number of pendings per group',
  buckets: [0, 1, 5, 20],
  labelNames: ['type'] as const,
})

const teamsPerGroupHisto = new prom.Histogram({
  name: 'teams_per_group',
  help: 'Number of teams per group',
  buckets: [0, 1, 5, 20, 100],
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

  teamsPerGroupHisto.reset()
  assignHistoPrometheusMetrics(teamsPerGroupHisto, repoMetrics.countTeamsPerGroupMetrics())

  membersPerGroupHisto.reset()
  assignHistoPrometheusMetrics(membersPerGroupHisto, repoMetrics.countMembersPerGroupMetrics(), { type: 'member' })
  assignHistoPrometheusMetrics(membersPerGroupHisto, repoMetrics.countAdminsPerGroupMetrics(), { type: 'admin' })
  assignHistoPrometheusMetrics(membersPerGroupHisto, repoMetrics.countOwnersPerGroupMetrics(), { type: 'owner' })

  pendingsPerGroupHisto.reset()
  assignHistoPrometheusMetrics(pendingsPerGroupHisto, repoMetrics.countPendingRequestsPerGroupMetrics(), { type: 'request' })
  assignHistoPrometheusMetrics(pendingsPerGroupHisto, repoMetrics.countPendingInvitesPerGroupMetrics(), { type: 'invite' })
}
