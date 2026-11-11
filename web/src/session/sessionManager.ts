import { createResource, type ResourceReturn } from "solid-js"

export interface PTYSession {
  id: string
  createdAt: Date
  pinned: boolean
  attached: boolean
}

interface PTYSessionDTO {
  id: string
  created_at: string // RFC3339
  pinned: boolean
  attached: boolean
}

const toSession = (dto: PTYSessionDTO): PTYSession => ({
  id: dto.id,
  createdAt: new Date(dto.created_at),
  pinned: dto.pinned,
  attached: dto.attached,
})

export class SessionManager {
  #token: string
  #resource: ResourceReturn<PTYSession[]>

  constructor(token: string) {
    this.#token = token
    this.#resource = createResource(async () => {
      const res = await this.#request("/sessions")
      if (!res.ok) {
        throw new Error(`GET /api/sessions failed: ${res.status} ${res.statusText}`)
      }
      const body = (await res.json()) as { sessions: PTYSessionDTO[] }
      return body.sessions.map(toSession)
    })
  }

  get sessions(): readonly PTYSession[] {
    return this.#resource[0].latest ?? []
  }

  get loading(): boolean {
    return this.#resource[0].loading
  }

  get error(): unknown {
    return this.#resource[0].error
  }

  get(id: string): PTYSession | undefined {
    return this.sessions.find((s) => s.id === id)
  }

  refresh() {
    return this.#resource[1].refetch()
  }

  pin(id: string) {
    return this.#setPinned(id, true)
  }

  unpin(id: string) {
    return this.#setPinned(id, false)
  }

  async delete(id: string): Promise<void> {
    const res = await this.#request(`/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    if (res.status === 204 || res.status === 404) {
      this.#remove(id)
      if (res.status === 404) throw new Error(`Session not found: ${id}`)
      return
    }
    throw new Error(`DELETE /api/sessions/${id} failed: ${res.status} ${res.statusText}`)
  }

  async #setPinned(id: string, pinned: boolean): Promise<PTYSession | null> {
    const res = await this.#request(`/sessions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    })

    switch (res.status) {
      case 200: {
        const updated = toSession((await res.json()) as PTYSessionDTO)
        this.#resource[1].mutate((list) => list?.map((s) => (s.id === id ? updated : s)))
        return updated
      }
      case 204:
        this.#remove(id)
        return null
      case 404:
        this.#remove(id)
        throw new Error(`Session not found: ${id}`)
      default:
        throw new Error(`PATCH /api/sessions/${id} failed: ${res.status} ${res.statusText}`)
    }
  }

  #remove(id: string) {
    this.#resource[1].mutate((list) => list?.filter((s) => s.id !== id))
  }

  #request(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`//${location.host}/api${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${this.#token}`,
      },
    })
  }
}
