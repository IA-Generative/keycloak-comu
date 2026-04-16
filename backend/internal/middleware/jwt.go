package auth

import (
	"context"
	"net/http"
	"strings"

	appconfig "github.com/IA-Generative/keycloak-comu-new/backend/internal/config"
	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

type principalKey struct{}

type Principal struct {
	Subject           string        `json:"sub"`
	Email             string        `json:"email,omitempty"`
	PreferredUsername string        `json:"preferred_username,omitempty"`
	Claims            jwt.MapClaims `json:"claims"`
}

type Authenticator struct {
	issuer         string
	internalIssuer string
	clientID       string
	jwks           *keyfunc.JWKS
}

func NewAuthenticator(cfg appconfig.OIDCConfig) (*Authenticator, error) {
	jwks, err := keyfunc.Get(cfg.JWKSURL, keyfunc.Options{RefreshUnknownKID: true})
	if err != nil {
		return nil, err
	}

	return &Authenticator{
		issuer:   cfg.IssuerURL,
		clientID: cfg.ClientID,
		jwks:     jwks,
	}, nil
}

func (a *Authenticator) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := strings.TrimSpace(r.Header.Get("Authorization"))
		if !strings.HasPrefix(header, "Bearer ") {
			next.ServeHTTP(w, r)
			return
		}

		principal, err := a.Parse(strings.TrimSpace(strings.TrimPrefix(header, "Bearer ")))
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), principalKey{}, principal)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (a *Authenticator) Parse(token string) (*Principal, error) {
	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, a.jwks.Keyfunc)
	if err != nil || !parsed.Valid {
		return nil, err
	}

	issuer, _ := claims["iss"].(string)
	if issuer != a.issuer && issuer != a.internalIssuer {
		return nil, jwt.ErrTokenInvalidIssuer
	}

	if !validAudience(claims, a.clientID) {
		return nil, jwt.ErrTokenInvalidAudience
	}

	principal := &Principal{Claims: claims}
	principal.Subject, _ = claims["sub"].(string)
	principal.Email, _ = claims["email"].(string)
	principal.PreferredUsername, _ = claims["preferred_username"].(string)
	return principal, nil
}

func PrincipalFromContext(ctx context.Context) (*Principal, bool) {
	principal, ok := ctx.Value(principalKey{}).(*Principal)
	return principal, ok
}

func validAudience(claims jwt.MapClaims, clientID string) bool {
	if audience, ok := claims["aud"].([]any); ok {
		for _, value := range audience {
			if stringValue, ok := value.(string); ok && stringValue == clientID {
				return true
			}
		}
	}
	if audience, ok := claims["aud"].(string); ok && audience == clientID {
		return true
	}
	if authorizedParty, ok := claims["azp"].(string); ok && authorizedParty == clientID {
		return true
	}
	return false
}
