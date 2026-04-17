package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"slices"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	chimMetrics "github.com/go-chi/metrics"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"

	appconfig "github.com/IA-Generative/keycloak-comu-new/backend/internal/config"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/featureflags"
	groupsapp "github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/application"
	auth "github.com/IA-Generative/keycloak-comu-new/backend/internal/middleware"
)

const MetricPath = "/metrics"
const ReadyPath = "/readyz"
const HealthPath = "/healthz"

var SpecialPaths = []string{MetricPath, ReadyPath, HealthPath}

var safeTextRegex = regexp.MustCompile(`['";<>]`)

func sanitize(s string) string {
	return strings.TrimSpace(safeTextRegex.ReplaceAllString(s, ""))
}

func newHumaConfig(cfg *appconfig.Config) huma.Config {
	config := huma.DefaultConfig("Keycloak Community API", "1.0.0")
	config.OpenAPIPath = "/openapi"
	config.DocsRenderer = huma.DocsRendererSwaggerUI
	config.CreateHooks = nil
	config.OpenAPI.Servers = []*huma.Server{{URL: cfg.Server.PublicURL + "/api"}}
	config.OpenAPI.Security = []map[string][]string{{"Authorization": {"basic"}}}
	config.OpenAPI.Components = &huma.Components{SecuritySchemes: map[string]*huma.SecurityScheme{
		"Authorization": {
			Type:         "http",
			Name:         "Authorization Code",
			Scheme:       "bearer",
			BearerFormat: "JWT",
		},
	}}
	return config
}

func WriteSpec(cfg *appconfig.Config, log *zap.Logger) {
	router := chi.NewRouter()
	api := humachi.New(router, newHumaConfig(cfg))
	registerAuthRoutes(api, cfg)
	registerPublicConfigRoutes(api, cfg)
	registerGroupRoutes(api, nil, log)
	registerUserRoutes(api, nil, log)
	registerFeatureFlagRoutes(api, nil)

	if err := os.MkdirAll("docs", 0o750); err != nil {
		log.Panic("failed to create docs directory", zap.Error(err))
	}

	f, err := os.Create("docs/openapi.json")
	if err != nil {
		log.Panic("failed to create spec file", zap.Error(err))
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "\t")
	if err := enc.Encode(api.OpenAPI()); err != nil {
		log.Panic("failed to encode spec", zap.Error(err))
	}
}

func NewRouter(cfg *appconfig.Config, db *sqlx.DB, authenticator *auth.Authenticator, groupService *groupsapp.Service, flags *featureflags.Flags, logger *zap.Logger) http.Handler {
	router := chi.NewRouter()

	router.Use(chimMetrics.Collector(chimMetrics.CollectorOpts{
		Host:  true,
		Proto: true,
		Skip: func(r *http.Request) bool {
			return slices.Contains(SpecialPaths, r.URL.Path)
		},
	}))

	router.Use(chimiddleware.RequestID)
	router.Use(chimiddleware.RealIP)
	router.Use(chimiddleware.Recoverer)

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.Server.CORS.AllowedOrigins,
		AllowedMethods:   cfg.Server.CORS.AllowedMethods,
		AllowedHeaders:   cfg.Server.CORS.AllowedHeaders,
		AllowCredentials: cfg.Server.CORS.AllowCredentials,
		MaxAge:           cfg.Server.CORS.MaxAgeSeconds,
	}))
	router.Use(authenticator.Middleware)
	router.Use(chimiddleware.Logger)
	router.Use(chimiddleware.Recoverer)
	router.Handle(MetricPath, chimMetrics.Handler())

	router.Get(HealthPath, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	router.Get(ReadyPath, func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if err := db.PingContext(ctx); err != nil {
			http.Error(w, "postgres unavailable", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ready"}`))
	})

	router.Route("/api", func(apiRouter chi.Router) {
		registerNotificationStreamRoute(apiRouter, groupService, logger)
		api := humachi.New(apiRouter, newHumaConfig(cfg))
		registerAuthRoutes(api, cfg)
		registerPublicConfigRoutes(api, cfg)
		registerGroupRoutes(api, groupService, logger)
		registerUserRoutes(api, groupService, logger)
		registerFeatureFlagRoutes(api, flags)
	})

	transport := chimMetrics.Transport(chimMetrics.TransportOpts{Host: true})
	http.DefaultClient.Transport = transport(http.DefaultTransport)

	if cfg.Frontend.Enabled {
		logger.Info("frontend enabled, mounting static file server")
		frontendPath := "/static"
		idx, err := prepareIdxHtml(frontendPath, logger)
		if err == nil {
			router.Handle("/*", spaHandler(frontendPath, idx))
		}
	}

	return router
}

func requirePrincipal(ctx context.Context) (*auth.Principal, error) {
	principal, ok := auth.PrincipalFromContext(ctx)
	if !ok {
		return nil, huma.Error401Unauthorized("missing access token")
	}
	return principal, nil
}

func mapServiceError(err error) error {
	switch {
	case errors.Is(err, groupsapp.ErrInsufficientPermissions):
		return huma.Error403Forbidden(err.Error())
	case errors.Is(err, groupsapp.ErrGroupNotFound):
		return huma.Error404NotFound(err.Error())
	case errors.Is(err, groupsapp.ErrUserNotFound):
		return huma.Error404NotFound(err.Error())
	case errors.Is(err, groupsapp.ErrUserAlreadyMember),
		errors.Is(err, groupsapp.ErrUserAlreadyRequesting),
		errors.Is(err, groupsapp.ErrGroupAlreadyExists):
		return huma.Error409Conflict(err.Error())
	case errors.Is(err, groupsapp.ErrCannotLeaveOnlyOwner),
		errors.Is(err, groupsapp.ErrCannotKickSelf),
		errors.Is(err, groupsapp.ErrCannotKickSameLevel),
		errors.Is(err, groupsapp.ErrCannotDemoteOnlyOwner),
		errors.Is(err, groupsapp.ErrCannotGrantEqualLevel),
		errors.Is(err, groupsapp.ErrCannotDemoteHigherLevel),
		errors.Is(err, groupsapp.ErrUserNotInvited),
		errors.Is(err, groupsapp.ErrUserNotRequesting),
		errors.Is(err, groupsapp.ErrInvalidLevel):
		return huma.Error400BadRequest(err.Error())
	default:
		return huma.Error500InternalServerError("internal server error")
	}
}

// ── Auth routes ────────────────────────────────────────────────────────────

type authConfigOutput struct {
	Body struct {
		IssuerURL        string `json:"issuer_url"`
		AuthorizationURL string `json:"authorization_url"`
		TokenURL         string `json:"token_url"`
		LogoutURL        string `json:"logout_url"`
		ClientID         string `json:"client_id"`
	}
}

type publicConfigOutput struct {
	Body struct {
		AppTitle      string `json:"appTitle"`
		Version       string `json:"version"`
		RootGroupPath string `json:"rootGroupPath"`
	}
}

type meOutput struct {
	Body *auth.Principal
}

func registerAuthRoutes(api huma.API, cfg *appconfig.Config) {
	huma.Register(api, huma.Operation{
		OperationID: "auth-config",
		Method:      http.MethodGet,
		Path:        "/auth/config",
		Tags:        []string{"auth"},
		Summary:     "OIDC client settings",
	}, func(_ context.Context, _ *struct{}) (*authConfigOutput, error) {
		issuer := strings.TrimRight(cfg.OIDC.IssuerURL, "/")
		output := &authConfigOutput{}
		output.Body.IssuerURL = issuer
		output.Body.AuthorizationURL = issuer + "/protocol/openid-connect/auth"
		output.Body.TokenURL = issuer + "/protocol/openid-connect/token"
		output.Body.LogoutURL = issuer + "/protocol/openid-connect/logout"
		output.Body.ClientID = cfg.OIDC.ClientID
		return output, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "me",
		Method:      http.MethodGet,
		Path:        "/me",
		Tags:        []string{"auth"},
		Summary:     "Current caller profile",
		Security:    []map[string][]string{{"bearerAuth": {}}},
	}, func(ctx context.Context, _ *struct{}) (*meOutput, error) {
		principal, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		return &meOutput{Body: principal}, nil
	})
}

func registerPublicConfigRoutes(api huma.API, cfg *appconfig.Config) {
	huma.Register(api, huma.Operation{
		OperationID: "public-config",
		Method:      http.MethodGet,
		Path:        "/config",
		Tags:        []string{"config"},
		Summary:     "Public client configuration",
	}, func(_ context.Context, _ *struct{}) (*publicConfigOutput, error) {
		output := &publicConfigOutput{}
		output.Body.AppTitle = cfg.Server.AppTitle
		output.Body.Version = cfg.Server.Version
		output.Body.RootGroupPath = cfg.Keycloak.RootGroupPath
		return output, nil
	})
}

// ── SPA handler ────────────────────────────────────────────────────────────

func prepareIdxHtml(srcDir string, logger *zap.Logger) (string, error) {
	idxPath := filepath.Join(srcDir, "index.html")
	data, err := os.ReadFile(idxPath)
	if err != nil {
		logger.Fatal("index.html not found in frontend dist", zap.String("path", idxPath))
		return "", errors.New("unable to find index.html")
	}
	return string(data), nil
}

func spaHandler(dir string, idxHtml string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := filepath.Join(dir, path.Clean(r.URL.Path))
		fi, err := os.Stat(p)
		if err == nil && !fi.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(idxHtml))
	})
}

// ── Feature flag routes ────────────────────────────────────────────────────

type featureFlagsOutput struct {
	Body []string
}

func registerFeatureFlagRoutes(api huma.API, flags *featureflags.Flags) {
	huma.Register(api, huma.Operation{
		OperationID: "get-feature-flags",
		Method:      http.MethodGet,
		Path:        "/v1/feature-flags",
		Tags:        []string{"feature-flags"},
		Summary:     "List enabled feature flags",
	}, func(_ context.Context, _ *struct{}) (*featureFlagsOutput, error) {
		if flags == nil {
			return &featureFlagsOutput{Body: []string{}}, nil
		}
		return &featureFlagsOutput{Body: flags.EnabledPublic()}, nil
	})
}
