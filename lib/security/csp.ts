export type BuildCspOptions = {
  nonce: string
  isDev?: boolean
}

const GOOGLE_FONTS_STYLE = "https://fonts.googleapis.com"
const GOOGLE_FONTS_ASSETS = "https://fonts.gstatic.com"

export function buildCsp({ nonce, isDev = false }: BuildCspOptions): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    "style-src": ["'self'", `'nonce-${nonce}'`, GOOGLE_FONTS_STYLE],
    "style-src-elem": ["'self'", `'nonce-${nonce}'`, GOOGLE_FONTS_STYLE],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", GOOGLE_FONTS_ASSETS],
    "connect-src": ["'self'"],
    "frame-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  }

  if (isDev) {
    directives["script-src"].push("'unsafe-eval'")
    directives["connect-src"].push("ws://localhost:*", "http://localhost:*")
    directives["style-src"].push("'unsafe-inline'")
    directives["style-src-elem"].push("'unsafe-inline'")
  }

  return Object.entries(directives)
    .map(([key, value]) => `${key} ${Array.from(new Set(value)).join(' ')}`)
    .join('; ')
}
