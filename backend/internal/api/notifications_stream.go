package api

import (
	"net/http"
	"time"

	groupsapp "github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/application"
	auth "github.com/IA-Generative/keycloak-comu-new/backend/internal/middleware"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

const notificationsUpdatedEvent = "notifications-updated"

func registerNotificationStreamRoute(router chi.Router, service *groupsapp.Service, logger *zap.Logger) {
	if service == nil {
		return
	}

	router.Get("/v1/notifications/stream", func(w http.ResponseWriter, r *http.Request) {
		principal, ok := auth.PrincipalFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}

		controller := http.NewResponseController(w)
		if err := controller.SetWriteDeadline(time.Time{}); err != nil {
			logger.Warn("failed to clear write deadline for notifications stream", zap.String("userID", principal.Subject), zap.Error(err))
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		updates, unsubscribe := service.SubscribeToNotifications(principal.Subject)
		defer unsubscribe()

		if err := writeSSEEvent(w, notificationsUpdatedEvent, "{}"); err != nil {
			logger.Debug("failed to send initial notifications event", zap.String("userID", principal.Subject), zap.Error(err))
			return
		}
		flusher.Flush()

		keepAlive := time.NewTicker(25 * time.Second)
		defer keepAlive.Stop()

		for {
			select {
			case <-r.Context().Done():
				return
			case <-updates:
				if err := writeSSEEvent(w, notificationsUpdatedEvent, "{}"); err != nil {
					logger.Debug("failed to write notifications event", zap.String("userID", principal.Subject), zap.Error(err))
					return
				}
				flusher.Flush()
			case <-keepAlive.C:
				if _, err := w.Write([]byte(": keepalive\n\n")); err != nil {
					logger.Debug("failed to write notifications keepalive", zap.String("userID", principal.Subject), zap.Error(err))
					return
				}
				flusher.Flush()
			}
		}
	})
}

func writeSSEEvent(w http.ResponseWriter, eventName string, data string) error {
	_, err := w.Write([]byte("event: " + eventName + "\n" + "data: " + data + "\n\n"))
	return err
}
