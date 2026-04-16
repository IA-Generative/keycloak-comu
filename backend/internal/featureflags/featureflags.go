package featureflags

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/Nerzal/gocloak/v13"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

// Public flags are exposed via the API.
// Internal flags are used server-side only.
type Flags struct {
	mu       sync.RWMutex
	public   map[string]bool
	internal map[string]bool
}

func New() *Flags {
	return &Flags{
		public: map[string]bool{
			"userSettings": false,
		},
		internal: map[string]bool{
			"trgmSearch": false,
		},
	}
}

// Init detects feature flags at startup from Keycloak and PostgreSQL.
func (f *Flags) Init(ctx context.Context, kc *gocloak.GoCloak, token, realm string, db *sqlx.DB, log *zap.Logger) {
	f.detectUserSettings(ctx, kc, token, realm, log)
	f.detectTrgmSearch(ctx, db, log)
}

// EnabledPublic returns the list of public flag names that are enabled.
func (f *Flags) EnabledPublic() []string {
	f.mu.RLock()
	defer f.mu.RUnlock()
	var out []string
	for name, enabled := range f.public {
		if enabled {
			out = append(out, name)
		}
	}
	return out
}

// IsEnabled checks whether a flag (public or internal) is enabled.
func (f *Flags) IsEnabled(name string) bool {
	f.mu.RLock()
	defer f.mu.RUnlock()
	if v, ok := f.public[name]; ok {
		return v
	}
	if v, ok := f.internal[name]; ok {
		return v
	}
	return false
}

// AllFlags returns all flags (public + internal) with their status.
func (f *Flags) AllFlags() map[string]bool {
	f.mu.RLock()
	defer f.mu.RUnlock()
	all := make(map[string]bool, len(f.public)+len(f.internal))
	for k, v := range f.public {
		all[k] = v
	}
	for k, v := range f.internal {
		all[k] = v
	}
	return all
}

// detectUserSettings checks the Keycloak UserProfile component to determine
// if unmanaged attributes are enabled (matching the original Node.js logic).
func (f *Flags) detectUserSettings(ctx context.Context, kc *gocloak.GoCloak, token, realm string, log *zap.Logger) {
	components, err := kc.GetComponents(ctx, token, realm)
	if err != nil {
		log.Error("feature-flags: failed to get keycloak components", zap.Error(err))
		return
	}

	for _, c := range components {
		if c.ProviderType == nil || *c.ProviderType != "org.keycloak.userprofile.UserProfileProvider" {
			continue
		}
		if c.ComponentConfig == nil {
			continue
		}
		cfgVals, ok := (*c.ComponentConfig)["kc.user.profile.config"]
		if !ok || len(cfgVals) == 0 {
			continue
		}
		var parsed struct {
			UnmanagedAttributePolicy string `json:"unmanagedAttributePolicy"`
		}
		if err := json.Unmarshal([]byte(cfgVals[0]), &parsed); err != nil {
			log.Warn("feature-flags: failed to parse user profile config", zap.Error(err))
			continue
		}
		enabled := parsed.UnmanagedAttributePolicy != "" && parsed.UnmanagedAttributePolicy != "DISABLED"

		f.mu.Lock()
		f.public["userSettings"] = enabled
		f.mu.Unlock()

		log.Info("feature-flags: userSettings", zap.Bool("enabled", enabled))
		return
	}
	log.Info("feature-flags: userSettings component not found, defaulting to false")
}

// detectTrgmSearch checks whether the pg_trgm extension is installed.
func (f *Flags) detectTrgmSearch(ctx context.Context, db *sqlx.DB, log *zap.Logger) {
	var exists bool
	err := db.GetContext(ctx, &exists, `SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')`)
	if err != nil {
		log.Warn("feature-flags: failed to detect pg_trgm", zap.Error(err))
		return
	}

	f.mu.Lock()
	f.internal["trgmSearch"] = exists
	f.mu.Unlock()

	log.Info("feature-flags: trgmSearch", zap.Bool("enabled", exists))
}
