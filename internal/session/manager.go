package session

import (
	"errors"
	"sort"
	"sync"
	"time"

	"github.com/creack/pty"
)

var ErrSessionNotFound = errors.New("session not found")

type SessionInfo struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	Pinned    bool      `json:"pinned"`
	Attached  bool      `json:"attached"`
}

type SessionManager struct {
	cfg      SessionConfig
	mu       sync.RWMutex
	sessions map[string]*PTYSession
}

func NewSessionManager(cfg SessionConfig) *SessionManager {
	return &SessionManager{cfg: cfg, sessions: make(map[string]*PTYSession)}
}

func (m *SessionManager) Create(size *pty.Winsize) (*PTYSession, error) {
	sess, err := NewPTYSession(m.cfg, size)
	if err != nil {
		return nil, err
	}

	m.mu.Lock()
	m.sessions[sess.ID] = sess
	m.mu.Unlock()

	// シェルが自然終了したらmapからも消す
	go func() {
		<-sess.Done()
		m.remove(sess)
	}()
	return sess, nil
}

func (m *SessionManager) remove(sess *PTYSession) {
	m.mu.Lock()
	if m.sessions[sess.ID] == sess {
		delete(m.sessions, sess.ID)
	}
	m.mu.Unlock()
}

func (m *SessionManager) Get(id string) (*PTYSession, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	sess, ok := m.sessions[id]
	if !ok {
		return nil, ErrSessionNotFound
	}
	return sess, nil
}

func (m *SessionManager) List() []SessionInfo {
	m.mu.RLock()
	list := make([]SessionInfo, 0, len(m.sessions))
	for _, s := range m.sessions {
		list = append(list, s.Info())
	}
	m.mu.RUnlock()

	sort.Slice(list, func(i, j int) bool { return list[i].CreatedAt.Before(list[j].CreatedAt) })
	return list
}

// SetPinned はピン留めを切り替える。
// 解除時にクライアントが繋がっていなければ、デフォルト挙動に従い破棄する。
func (m *SessionManager) SetPinned(id string, pinned bool) error {
	sess, err := m.Get(id)
	if err != nil {
		return err
	}
	attached := sess.setPinned(pinned)
	if !pinned && !attached {
		return m.Delete(id)
	}
	return nil
}

func (m *SessionManager) Delete(id string) error {
	m.mu.Lock()
	sess, ok := m.sessions[id]
	delete(m.sessions, id)
	m.mu.Unlock()
	if !ok {
		return ErrSessionNotFound
	}
	return sess.Close() // 接続中のクライアントはreadLoop終了時に切断される
}

// Detach はWS切断時に呼ぶ。現在のクライアントが外れ、かつピン留めされていなければ破棄。
func (m *SessionManager) Detach(sess *PTYSession, sink Sink) {
	wasCurrent, pinned := sess.detach(sink)
	if wasCurrent && !pinned {
		_ = m.Delete(sess.ID)
	}
}

func (m *SessionManager) CloseAll() {
	m.mu.Lock()
	all := make([]*PTYSession, 0, len(m.sessions))
	for _, s := range m.sessions {
		all = append(all, s)
	}
	m.sessions = make(map[string]*PTYSession)
	m.mu.Unlock()

	for _, s := range all {
		_ = s.Close()
	}
}
