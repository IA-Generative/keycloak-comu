package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/api"
	appconfig "github.com/IA-Generative/keycloak-comu-new/backend/internal/config"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/database"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/featureflags"
	groupsapp "github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/application"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/keycloak"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/logger"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/metrics"
	auth "github.com/IA-Generative/keycloak-comu-new/backend/internal/middleware"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/repository"
)

func main() {
	cfg, err := appconfig.Load()
	if err != nil {
		panic(err)
	}

	log, err := logger.New(cfg.Server.Env)
	if err != nil {
		panic(err)
	}
	defer log.Sync()

	// Fast path: write OpenAPI spec without connecting to any external service.
	if cfg.Server.WriteSpecOnly {
		api.WriteSpec(cfg, log)
		log.Info("spec written, exiting")
		return
	}

	db, err := database.NewPostgres(cfg.Database.URL)
	if err != nil {
		log.Fatal("postgres connection failed", logger.Error(err))
	}
	defer db.Close()

	authenticator, err := auth.NewAuthenticator(cfg.OIDC)
	if err != nil {
		log.Fatal("oidc authenticator init failed", logger.Error(err))
	}

	// Feature flags
	flags := featureflags.New()

	metricsService := metrics.NewService(nil, cfg.Server.InstanceID, cfg.Server.Version, flags)

	// Repositories
	kcClient, err := keycloak.NewKeycloakClient(cfg.Keycloak, log)
	if err != nil {
		log.Fatal("keycloak client init failed", logger.Error(err))
	}
	repo := repository.NewKeycloakRepository(kcClient, cfg.Keycloak.Realm, cfg.Keycloak.RootGroupPath, db, log, flags)
	mailer := repository.NewMailer(cfg.SMTP, log, metricsService)

	// Initialize feature flags (Keycloak user profile + pg_trgm detection)
	flags.Init(context.Background(), kcClient.Client, kcClient.GetToken(), cfg.Keycloak.Realm, db, log)

	// Start periodic metrics collection (every 10s, matching original)
	metricsCtx, metricsCancel := context.WithCancel(context.Background())
	defer metricsCancel()
	go metricsService.StartCollectionLoop(metricsCtx, repo, 10*time.Second, log)

	// Application service

	notificationBroker := groupsapp.NewNotificationBroker()
	service := groupsapp.NewService(repo, mailer, metricsService, notificationBroker, log)

	router := api.NewRouter(cfg, db, authenticator, service, flags, log)

	server := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeoutSeconds) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeoutSeconds) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeoutSeconds) * time.Second,
	}

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info("server starting", logger.String("port", cfg.Server.Port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("server stopped unexpectedly", logger.Error(err))
		}
	}()

	<-shutdown
	shutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutCtx); err != nil {
		log.Error("graceful shutdown failed", logger.Error(err))
	}
	log.Info("server stopped")
}
