package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/keycloak"
)

const settingsPrefix = "keycloak-comu.settings."

// FeatureFlagChecker allows checking the state of a feature flag at runtime.
type FeatureFlagChecker interface {
	IsEnabled(name string) bool
}

// KeycloakRepository implements ports.Repository using the Keycloak Admin
// REST API (via gocloak) combined with direct PostgreSQL reads.
type KeycloakRepository struct {
	kc            *keycloak.KeycloakClient
	realm         string
	rootGroupID   *string // optional filtering parent
	rootGroupPath string  // optional filtering parent
	db            *sqlx.DB
	realmID       string
	logger        *zap.Logger
	flags         FeatureFlagChecker
}

func NewKeycloakRepository(
	kc *keycloak.KeycloakClient,
	realm string,
	rootGroupPath string,
	db *sqlx.DB,
	logger *zap.Logger,
	flags FeatureFlagChecker,
) *KeycloakRepository {

	realmID, err := GetRealmID(context.Background(), db, realm)
	if err != nil {
		logger.Fatal("failed to get realm ID from database", zap.Error(err))
	}
	repo := &KeycloakRepository{
		kc:            kc,
		realm:         realm,
		rootGroupPath: rootGroupPath,
		db:            db,
		realmID:       realmID,
		logger:        logger,
		flags:         flags,
	}

	rootGroupID, err := repo.FindRootGroupID(context.Background(), kc.GetToken(), realm, rootGroupPath)
	if err != nil {
		logger.Fatal("failed to find root group", zap.Error(err))
	}
	repo.rootGroupID = &rootGroupID
	return repo
}

// GetRealmID fetches the realm ID from the database.
func GetRealmID(ctx context.Context, db *sqlx.DB, realmName string) (string, error) {
	var id string
	err := db.GetContext(ctx, &id, `SELECT id FROM realm WHERE name = $1`, realmName)
	return id, err
}
