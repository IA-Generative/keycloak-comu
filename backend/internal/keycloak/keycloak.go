package keycloak

import (
	"context"
	"time"

	"github.com/Nerzal/gocloak/v13"
	"go.uber.org/zap"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/config"
)

type KeycloakClient struct {
	token     *gocloak.JWT
	tokenTime time.Time // when the token was obtained
	Client    *gocloak.GoCloak
	logger    *zap.Logger
}

func NewKeycloakClient(cfg config.KeycloakConfig, logger *zap.Logger) (*KeycloakClient, error) {
	client := gocloak.NewClient(cfg.URL)
	ctx := context.Background()
	token, err := client.LoginAdmin(ctx, cfg.Admin.Username, cfg.Admin.Password, cfg.Admin.Realm)
	if err != nil {
		logger.Fatal("keycloak admin login failed", zap.Error(err))
		return nil, err
	}
	kc := &KeycloakClient{
		token:     token,
		tokenTime: time.Now(),
		Client:    client,
		logger:    logger,
	}
	go kc.refreshTokenLoop(cfg)
	return kc, nil
}

func (kc *KeycloakClient) GetToken() string {
	if kc.token == nil {
		kc.logger.Warn("keycloak token is nil, no access token available")
		return ""
	}
	return kc.token.AccessToken
}

// refreshTokenLoop refreshes the token 1 minute before its expiration, forever.
func (kc *KeycloakClient) refreshTokenLoop(cfg config.KeycloakConfig) {
	for {
		expiresIn := time.Duration(kc.token.ExpiresIn) * time.Second
		refreshAt := expiresIn * 9 / 10 // refresh at 90% of the token lifetime
		if refreshAt <= 0 {
			refreshAt = 10 * time.Second
		}
		deadline := kc.tokenTime.Add(refreshAt)
		sleepDur := time.Until(deadline)
		kc.logger.Debug("keycloak token refresh scheduled", zap.Time("refresh_time", deadline), zap.Duration("sleep_duration", sleepDur))
		if sleepDur > 0 {
			time.Sleep(sleepDur)
		}

		newToken, err := kc.Client.LoginAdmin(context.Background(), cfg.Admin.Username, cfg.Admin.Password, cfg.Admin.Realm)
		if err != nil {
			kc.logger.Error("keycloak re-login failed, retrying in 10s", zap.Error(err))
			time.Sleep(10 * time.Second)
			continue
		}
		kc.token = newToken
		kc.tokenTime = time.Now()
	}
}
