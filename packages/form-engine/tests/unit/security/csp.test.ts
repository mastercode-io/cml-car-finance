import { buildCsp } from "@/lib/security/csp"

describe("buildCsp", () => {
  it("includes nonce-bound directives in production", () => {
    const csp = buildCsp({ nonce: "abc123" })

    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'")
    expect(csp).toContain("style-src 'self' 'nonce-abc123' https://fonts.googleapis.com")
    expect(csp).not.toContain("'unsafe-eval'")
  })

  it("allows dev relaxations for tooling", () => {
    const csp = buildCsp({ nonce: "abc123", isDev: true })

    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain("ws://localhost:*")
    expect(csp).toContain("'unsafe-inline'")
  })
})
