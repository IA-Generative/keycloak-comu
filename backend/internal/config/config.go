package config

import (
	"errors"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	OIDC     OIDCConfig     `yaml:"oidc"`
	Keycloak KeycloakConfig `yaml:"keycloak"`
	SMTP     SMTPConfig     `yaml:"smtp"`
	Frontend FrontendConfig `yaml:"frontend"`
}

type ServerConfig struct {
	Env                 string     `yaml:"env"`
	Port                string     `yaml:"port"`
	PublicURL           string     `yaml:"public_url"`
	AppTitle            string     `yaml:"app_title"`
	Version             string     `yaml:"version"`
	ReadTimeoutSeconds  int        `yaml:"read_timeout_seconds"`
	WriteTimeoutSeconds int        `yaml:"write_timeout_seconds"`
	IdleTimeoutSeconds  int        `yaml:"idle_timeout_seconds"`
	CORS                CORSConfig `yaml:"cors"`
	WriteSpecOnly       bool       `yaml:"write_spec_only"`
	InstanceID          string     `yaml:"instance_id"`
}

type CORSConfig struct {
	AllowedOrigins   []string `yaml:"allowed_origins"`
	AllowedMethods   []string `yaml:"allowed_methods"`
	AllowedHeaders   []string `yaml:"allowed_headers"`
	AllowCredentials bool     `yaml:"allow_credentials"`
	MaxAgeSeconds    int      `yaml:"max_age_seconds"`
}

type DatabaseConfig struct {
	URL string `yaml:"url"`
}

type OIDCConfig struct {
	IssuerURL       string `yaml:"issuer_url"`
	JWKSURL         string `yaml:"jwks_url"`
	ClientID        string `yaml:"client_id"`
	SwaggerClientID string `yaml:"swagger_client_id"`
}

type KeycloakAdminConfig struct {
	Realm    string `yaml:"realm"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

type KeycloakConfig struct {
	URL           string              `yaml:"url"`
	InternalURL   string              `yaml:"internal_url"`
	Realm         string              `yaml:"realm"`
	Admin         KeycloakAdminConfig `yaml:"admin"`
	RootGroupPath string              `yaml:"root_group_path"`
}

type SMTPConfig struct {
	Enabled  bool   `yaml:"enabled"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	From     string `yaml:"from"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	BaseURL  string `yaml:"base_url"`
}

type FrontendConfig struct {
	Enabled bool `yaml:"enabled"`
}

func Load() (*Config, error) {
	path := getenv("CONFIG_FILE", "config/config.yaml")
	config := defaultConfig()

	if data, err := os.ReadFile(path); err == nil {
		if err := yaml.Unmarshal(data, config); err != nil {
			return nil, err
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}

	applyEnvOverrides(config)
	return config, nil
}

func defaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Env:                 "development",
			Port:                "8080",
			PublicURL:           "http://localhost:8080",
			AppTitle:            "Keycloak Community",
			ReadTimeoutSeconds:  10,
			WriteTimeoutSeconds: 15,
			IdleTimeoutSeconds:  30,
			InstanceID:          "UNKNOWN",
			CORS: CORSConfig{
				AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080"},
				AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Authorization", "Content-Type", "Accept"},
				AllowCredentials: true,
				MaxAgeSeconds:    300,
			},
		},
		Database: DatabaseConfig{URL: "postgres://keycloak:password@localhost:5432/keycloak?sslmode=disable"},
		OIDC: OIDCConfig{
			IssuerURL:       "http://localhost:8081/realms/mirai",
			JWKSURL:         "http://localhost:8081/realms/mirai/protocol/openid-connect/certs",
			ClientID:        "keycloak-comu",
			SwaggerClientID: "keycloak-comu-swagger",
		},
		Keycloak: KeycloakConfig{
			URL:           "http://localhost:8081",
			InternalURL:   "",
			Realm:         "mirai",
			RootGroupPath: "/",
			Admin: KeycloakAdminConfig{
				Realm:    "master",
				Username: "admin",
				Password: "admin",
			},
		},
		SMTP: SMTPConfig{
			Enabled: true,
			Host:    "mailhog",
			Port:    1025,
			From:    "noreply@keycloak-comu.local",
		},
		Frontend: FrontendConfig{Enabled: true},
	}
}

func applyEnvOverrides(config *Config) {
	config.Server.Env = getenv("ENV", config.Server.Env)
	config.Server.Port = getenv("PORT", config.Server.Port)
	config.Server.PublicURL = getenv("PUBLIC_URL", config.Server.PublicURL)
	config.Server.AppTitle = getenv("APP_TITLE", config.Server.AppTitle)
	config.Server.Version = getenv("APP_VERSION", config.Server.Version)
	config.Server.InstanceID = getenv("INSTANCE_ID", func() string {
		if v, err := os.Hostname(); err == nil {
			return v
		} else {
			return ""
		}
	}(), config.Server.InstanceID)
	config.Database.URL = getenv("DATABASE_URL", config.Database.URL)
	if strings.TrimSpace(os.Getenv("DATABASE_URL")) == "" {
		if dsn := postgresURLFromEnv(); dsn != "" {
			config.Database.URL = dsn
		}
	}
	config.OIDC.IssuerURL = getenv("OIDC_ISSUER_URL", config.OIDC.IssuerURL)
	config.OIDC.JWKSURL = getenv("OIDC_JWKS_URL", config.OIDC.JWKSURL)
	config.OIDC.ClientID = getenv("OIDC_CLIENT_ID", config.OIDC.ClientID)
	config.OIDC.SwaggerClientID = getenv("OIDC_SWAGGER_CLIENT_ID", config.OIDC.SwaggerClientID)
	config.Keycloak.URL = getenv("KEYCLOAK_URL", config.Keycloak.URL)
	config.Keycloak.InternalURL = getenv("KEYCLOAK_INTERNAL_URL", config.Keycloak.InternalURL, config.Keycloak.URL)
	config.Keycloak.Realm = getenv("KEYCLOAK_REALM", config.Keycloak.Realm)
	config.Keycloak.Admin.Realm = getenv("KEYCLOAK_ADMIN_REALM", config.Keycloak.Admin.Realm)
	config.Keycloak.Admin.Username = getenv("KEYCLOAK_ADMIN_USERNAME", config.Keycloak.Admin.Username)
	config.Keycloak.Admin.Password = getenv("KEYCLOAK_ADMIN_PASSWORD", config.Keycloak.Admin.Password)
	config.Keycloak.RootGroupPath = getenv("KEYCLOAK_ROOT_GROUP_PATH", config.Keycloak.RootGroupPath)
	config.SMTP.Enabled = getBool("SMTP_ENABLED", config.SMTP.Enabled)
	config.SMTP.Host = getenv("SMTP_HOST", config.SMTP.Host)
	config.SMTP.Port = getInt("SMTP_PORT", config.SMTP.Port)
	config.SMTP.From = getenv("SMTP_FROM", config.SMTP.From)
	config.SMTP.Username = getenv("SMTP_USERNAME", config.SMTP.Username)
	config.SMTP.Password = getenv("SMTP_PASSWORD", config.SMTP.Password)
	config.SMTP.BaseURL = getenv("PUBLIC_URL", config.Server.PublicURL)
	config.Server.CORS.AllowedOrigins = getCSV("CORS_ALLOWED_ORIGINS", config.Server.CORS.AllowedOrigins)
	config.Server.CORS.AllowedMethods = getCSV("CORS_ALLOWED_METHODS", config.Server.CORS.AllowedMethods)
	config.Server.CORS.AllowedHeaders = getCSV("CORS_ALLOWED_HEADERS", config.Server.CORS.AllowedHeaders)
	config.Server.CORS.AllowCredentials = getBool("CORS_ALLOW_CREDENTIALS", config.Server.CORS.AllowCredentials)
	config.Server.CORS.MaxAgeSeconds = getInt("CORS_MAX_AGE_SECONDS", config.Server.CORS.MaxAgeSeconds)
	config.Frontend.Enabled = getBool("FRONTEND_ENABLED", config.Frontend.Enabled)
	config.Server.WriteSpecOnly = getBool("WRITE_SPEC_ONLY", config.Server.WriteSpecOnly)
}

// Multi fallback getenv: checks primary env var, then first non-empty value from fallback list, then default fallback.
func getenv(key string, fallback ...string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	for _, fb := range fallback {
		if fb = strings.TrimSpace(fb); fb != "" {
			return fb
		}
	}
	return ""
}

func getCSV(key string, fallback []string) []string {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			values = append(values, value)
		}
	}
	if len(values) == 0 {
		return fallback
	}
	return values
}

func getBool(key string, fallback bool) bool {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	value, err := strconv.ParseBool(raw)
	if err != nil {
		return fallback
	}
	return value
}

func getInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}

func postgresURLFromEnv() string {
	host := strings.TrimSpace(os.Getenv("POSTGRES_HOST"))
	port := strings.TrimSpace(os.Getenv("POSTGRES_PORT"))
	database := strings.TrimSpace(os.Getenv("POSTGRES_DATABASE"))
	user := strings.TrimSpace(os.Getenv("POSTGRES_USER"))
	password := os.Getenv("POSTGRES_PASSWORD")

	if host == "" || port == "" || database == "" || user == "" || password == "" {
		return ""
	}

	sslMode := getenv("POSTGRES_SSLMODE", "disable")
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, password),
		Host:   net.JoinHostPort(host, port),
		Path:   database,
	}
	query := url.Values{}
	query.Set("sslmode", sslMode)
	u.RawQuery = query.Encode()
	return u.String()
}
