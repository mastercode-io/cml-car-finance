import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { buildCsp } from "@/lib/security/csp"

const NONCE_BYTES = 16
const isDev = process.env.NODE_ENV !== "production"

function generateNonce(): string {
  const bytes = new Uint8Array(NONCE_BYTES)
  crypto.getRandomValues(bytes)
  let binary = ""
  bytes.forEach((value) => {
    binary += String.fromCharCode(value)
  })
  return btoa(binary)
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set("Content-Security-Policy", buildCsp({ nonce, isDev }))
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-Content-Type-Options", "nosniff")

  return response
}

export const config = {
  matcher: "/:path*",
}
