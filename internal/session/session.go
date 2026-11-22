package session

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"time"

	"github.com/creack/pty"
)

const scrollbackSize = 256 * 1024

var ErrSessionClosed = errors.New("session closed")

type SessionConfig struct {
	Shell string
	Args  []string
	Env   []string
}

type Sink interface {
	Send(p []byte) error
	SendControl(v any) error
	Close() error
}

type PTYSession struct {
	ID        string
	CreatedAt time.Time
	title     string

	cmd  *exec.Cmd
	ptmx *os.File

	mu     sync.Mutex // protects pinned, sink, scroll and closed
	pinned bool
	sink   Sink
	scroll *ringBuffer
	closed bool

	done      chan struct{}
	closeOnce sync.Once
	closeErr  error
}

func newSessionID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func NewPTYSession(cfg SessionConfig, size *pty.Winsize) (*PTYSession, error) {
	cmd := exec.Command(cfg.Shell, cfg.Args...)
	cmd.Env = append(os.Environ(), cfg.Env...)

	ptmx, err := pty.StartWithSize(cmd, size)
	if err != nil {
		return nil, err
	}

	s := &PTYSession{
		ID:        newSessionID(),
		CreatedAt: time.Now(),
		cmd:       cmd,
		ptmx:      ptmx,
		scroll:    newRingBuffer(scrollbackSize),
		done:      make(chan struct{}),
	}
	go s.readLoop()
	return s, nil
}

func (s *PTYSession) readLoop() {
	buf := make([]byte, 32*1024)
	for {
		n, err := s.ptmx.Read(buf)
		if n > 0 {
			s.mu.Lock()
			s.scroll.Write(buf[:n])
			if s.sink != nil {
				if serr := s.sink.Send(buf[:n]); serr != nil {
					_ = s.sink.Close()
					s.sink = nil
				}
			}
			s.mu.Unlock()
		}
		if err != nil {
			break
		}
	}

	_ = s.Close()
	s.mu.Lock()
	s.closed = true
	if s.sink != nil {
		_ = s.sink.Close()
		s.sink = nil
	}
	s.mu.Unlock()
	close(s.done)
}

func (s *PTYSession) Done() <-chan struct{} { return s.done }

func (s *PTYSession) Attach(sink Sink) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.closed {
		return ErrSessionClosed
	}
	if s.sink != nil {
		_ = s.sink.Close()
		s.sink = nil
	}
	if s.scroll.size > 0 {
		if err := sink.Send(s.scroll.Bytes()); err != nil {
			return err
		}
	}
	s.sink = sink
	return nil
}

func (s *PTYSession) detach(sink Sink) (wasCurrent, pinned bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.sink == sink {
		s.sink = nil
		wasCurrent = true
	}
	return wasCurrent, s.pinned
}

func (s *PTYSession) setPinned(pinned bool) (attached bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pinned = pinned
	return s.sink != nil
}

func (s *PTYSession) setTitle(title string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.title = title
}

func (s *PTYSession) Info() SessionInfo {
	s.mu.Lock()
	defer s.mu.Unlock()
	return SessionInfo{
		ID:        s.ID,
		CreatedAt: s.CreatedAt,
		Title:     s.title,
		Pinned:    s.pinned,
		Attached:  s.sink != nil,
	}
}

func (s *PTYSession) Write(p []byte) (int, error) { return s.ptmx.Write(p) }

func (s *PTYSession) Resize(cols, rows uint16) error {
	return pty.Setsize(s.ptmx, &pty.Winsize{Cols: cols, Rows: rows})
}

// NotifyAttached sends v to the attached sink, if any.
// Returns true if a sink was attached.
func (s *PTYSession) NotifyAttached(v any) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.sink == nil {
		return false
	}
	if err := s.sink.SendControl(v); err != nil {
		_ = s.sink.Close()
		s.sink = nil
		return false
	}
	return true
}

func (s *PTYSession) Close() error {
	s.closeOnce.Do(func() {
		s.closeErr = s.ptmx.Close()

		p := s.cmd.Process
		if p == nil {
			return
		}
		_ = syscall.Kill(-p.Pid, syscall.SIGHUP)

		waitCh := make(chan struct{})
		go func() {
			_ = s.cmd.Wait()
			close(waitCh)
		}()

		select {
		case <-waitCh:
		case <-time.After(2 * time.Second):
			_ = syscall.Kill(-p.Pid, syscall.SIGKILL)
			<-waitCh
		}
	})
	return s.closeErr
}
