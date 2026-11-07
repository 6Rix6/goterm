export class TokenManager {
  static get(): string | null {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const token = params.get("token")

    if (token != null) {
      this.#save(token)
      history.replaceState(null, "", location.pathname + location.search)
      return token
    }

    return this.#load()
  }

  static #key = "socket_token"

  static #save(token: string): void {
    return localStorage.setItem(this.#key, token)
  }

  static #load(): string | null {
    return localStorage.getItem(this.#key)
  }
}
