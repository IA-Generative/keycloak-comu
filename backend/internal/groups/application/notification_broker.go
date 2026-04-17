package application

import "sync"

type NotificationBroker struct {
	mu          sync.RWMutex
	nextID      uint64
	subscribers map[string]map[uint64]chan struct{}
}

func NewNotificationBroker() *NotificationBroker {
	return &NotificationBroker{
		subscribers: make(map[string]map[uint64]chan struct{}),
	}
}

func (b *NotificationBroker) Subscribe(userID string) (<-chan struct{}, func()) {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.nextID++
	channelID := b.nextID
	ch := make(chan struct{}, 1)

	if b.subscribers[userID] == nil {
		b.subscribers[userID] = make(map[uint64]chan struct{})
	}
	b.subscribers[userID][channelID] = ch

	return ch, func() {
		b.mu.Lock()
		defer b.mu.Unlock()

		listeners := b.subscribers[userID]
		if listeners == nil {
			return
		}

		delete(listeners, channelID)
		close(ch)

		if len(listeners) == 0 {
			delete(b.subscribers, userID)
		}
	}
}

func (b *NotificationBroker) Publish(userIDs ...string) {
	seen := make(map[string]struct{}, len(userIDs))

	b.mu.RLock()
	defer b.mu.RUnlock()

	for _, userID := range userIDs {
		if userID == "" {
			continue
		}
		if _, ok := seen[userID]; ok {
			continue
		}
		seen[userID] = struct{}{}

		for _, ch := range b.subscribers[userID] {
			select {
			case ch <- struct{}{}:
			default:
			}
		}
	}
}
