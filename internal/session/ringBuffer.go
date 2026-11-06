package session

type ringBuffer struct {
	buf   []byte
	start int
	size  int
}

func newRingBuffer(capacity int) *ringBuffer {
	return &ringBuffer{buf: make([]byte, capacity)}
}

func (r *ringBuffer) Write(p []byte) {
	c := len(r.buf)
	if len(p) >= c {
		copy(r.buf, p[len(p)-c:])
		r.start, r.size = 0, c
		return
	}
	end := (r.start + r.size) % c
	n := copy(r.buf[end:], p)
	copy(r.buf, p[n:])

	if total := r.size + len(p); total > c {
		r.start = (r.start + total - c) % c
		r.size = c
	} else {
		r.size = total
	}
}

func (r *ringBuffer) Bytes() []byte {
	out := make([]byte, r.size)
	if r.start+r.size <= len(r.buf) {
		copy(out, r.buf[r.start:r.start+r.size])
	} else {
		n := copy(out, r.buf[r.start:])
		copy(out[n:], r.buf[:r.size-n])
	}
	return out
}
