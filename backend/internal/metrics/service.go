package metrics

import (
	"context"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
)

// DataProvider abstracts the DB queries needed for metric collection.
type DataProvider interface {
	CountGroups(ctx context.Context) (int, error)
	CountDistinctUsers(ctx context.Context) (int, error)
	CountMembersPerGroup(ctx context.Context) ([]int, error)
	CountOwnersPerGroup(ctx context.Context) ([]int, error)
	CountAdminsPerGroup(ctx context.Context) ([]int, error)
	CountPendingInvitesPerGroup(ctx context.Context) ([]int, error)
	CountPendingRequestsPerGroup(ctx context.Context) ([]int, error)
	CountTeamsPerGroup(ctx context.Context) ([]int, error)
	CountLinksPerGroup(ctx context.Context) ([]int, error)
}

// FeatureFlagProvider returns the current state of all feature flags.
type FeatureFlagProvider interface {
	AllFlags() map[string]bool
}

type Service struct {
	groupOperations *prometheus.CounterVec
	emailsSent      *prometheus.CounterVec

	groupCount prometheus.Gauge
	usersCount prometheus.Gauge

	membersPerGroup  *prometheus.HistogramVec
	pendingsPerGroup *prometheus.HistogramVec
	teamsPerGroup    *prometheus.HistogramVec
	linksPerGroup    *prometheus.HistogramVec

	featureFlags *prometheus.GaugeVec

	instanceID string
	version    string

	flags FeatureFlagProvider
}

func NewService(registerer prometheus.Registerer, instanceID, version string, flags FeatureFlagProvider) *Service {
	if registerer == nil {
		registerer = prometheus.DefaultRegisterer
	}
	reg := prometheus.WrapRegistererWith(prometheus.Labels{"instanceId": instanceID, "version": version}, registerer)
	service := &Service{
		groupOperations: prometheus.NewCounterVec(prometheus.CounterOpts{
			Subsystem: "groups",
			Name:      "operations_total",
			Help:      "Group service operations by name and result.",
		}, []string{"operation", "result"}),
		emailsSent: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "emails_sent_total",
			Help: "Total emails sent.",
		}, []string{"status"}),
		groupCount: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "group_count",
			Help: "Total number of groups.",
		}),
		usersCount: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "users_count",
			Help: "Total number of distinct users in groups.",
		}),
		membersPerGroup: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "members_per_group",
			Help:    "Number of members per group.",
			Buckets: []float64{0, 1, 5, 20, 100},
		}, []string{"type"}),
		pendingsPerGroup: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "pendings_per_group",
			Help:    "Number of pending items per group.",
			Buckets: []float64{0, 1, 5, 20},
		}, []string{"type"}),
		teamsPerGroup: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "teams_per_group",
			Help:    "Number of teams per group.",
			Buckets: []float64{0, 1, 5, 20, 100},
		}, []string{"type"}),
		linksPerGroup: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "links_per_group",
			Help:    "Number of links per group.",
			Buckets: []float64{0, 1, 5, 20},
		}, []string{"type"}),
		featureFlags: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "feature_flags",
			Help: "Feature flags status.",
		}, []string{"name"}),
	}

	reg.MustRegister(
		service.groupOperations,
		service.emailsSent,
		service.groupCount,
		service.usersCount,
		service.membersPerGroup,
		service.pendingsPerGroup,
		service.teamsPerGroup,
		service.linksPerGroup,
		service.featureFlags,
	)
	service.instanceID = instanceID
	service.version = version
	service.flags = flags
	service.initializeSeries()
	return service
}

func (s *Service) initializeSeries() {
	for _, op := range []string{"create", "get", "delete", "edit", "search", "list"} {
		s.groupOperations.WithLabelValues(op, "success")
		s.groupOperations.WithLabelValues(op, "error")
	}
	for _, st := range []string{"sent", "failed", "disabled"} {
		s.emailsSent.WithLabelValues(st)
	}
}

// ── Used by service (ports.MetricsRecorder) ────────────────────────────────

func (s *Service) ObserveGroupOperation(operation string, success bool) {
	result := "success"
	if !success {
		result = "error"
	}
	s.groupOperations.WithLabelValues(operation, result).Inc()
}

func (s *Service) ObserveEmailSent(status string) {
	s.emailsSent.WithLabelValues(status, s.instanceID, s.version).Inc()
}

// ── Periodic collection ────────────────────────────────────────────────────

// CollectMetrics fetches all metric data from the provider and updates gauges/histograms.
func (s *Service) CollectMetrics(ctx context.Context, provider DataProvider, log *zap.Logger) {
	if count, err := provider.CountGroups(ctx); err == nil {
		s.groupCount.Set(float64(count))
	} else {
		log.Warn("metrics: count groups", zap.Error(err))
	}

	if count, err := provider.CountDistinctUsers(ctx); err == nil {
		s.usersCount.Set(float64(count))
	} else {
		log.Warn("metrics: count users", zap.Error(err))
	}

	// Reset histograms before re-observing
	s.membersPerGroup.Reset()
	s.pendingsPerGroup.Reset()
	s.teamsPerGroup.Reset()
	s.linksPerGroup.Reset()

	observeIntsVec := func(h *prometheus.HistogramVec, label string, vals []int) {
		obs := h.WithLabelValues(label)
		for _, v := range vals {
			obs.Observe(float64(v))
		}
	}

	if vals, err := provider.CountMembersPerGroup(ctx); err == nil {
		observeIntsVec(s.membersPerGroup, "member", vals)
	}
	if vals, err := provider.CountOwnersPerGroup(ctx); err == nil {
		observeIntsVec(s.membersPerGroup, "owner", vals)
	}
	if vals, err := provider.CountAdminsPerGroup(ctx); err == nil {
		observeIntsVec(s.membersPerGroup, "admin", vals)
	}
	if vals, err := provider.CountPendingRequestsPerGroup(ctx); err == nil {
		observeIntsVec(s.pendingsPerGroup, "request", vals)
	}
	if vals, err := provider.CountPendingInvitesPerGroup(ctx); err == nil {
		observeIntsVec(s.pendingsPerGroup, "invite", vals)
	}
	if vals, err := provider.CountTeamsPerGroup(ctx); err == nil {
		observeIntsVec(s.teamsPerGroup, "team", vals)
	}
	if vals, err := provider.CountLinksPerGroup(ctx); err == nil {
		observeIntsVec(s.linksPerGroup, "link", vals)
	}

	// Export feature flags
	if s.flags != nil {
		for name, enabled := range s.flags.AllFlags() {
			v := 0.0
			if enabled {
				v = 1.0
			}
			s.featureFlags.WithLabelValues(name).Set(v)
		}
	}
}

// StartCollectionLoop runs CollectMetrics every interval until ctx is cancelled.
func (s *Service) StartCollectionLoop(ctx context.Context, provider DataProvider, interval time.Duration, log *zap.Logger) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Collect once immediately
	s.CollectMetrics(ctx, provider, log)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.CollectMetrics(ctx, provider, log)
		}
	}
}
