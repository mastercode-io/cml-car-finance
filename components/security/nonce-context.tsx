"use client"

import { createContext, useContext } from "react"
import type { ReactNode } from "react"

type Props = {
  nonce?: string
  children: ReactNode
}

const NonceContext = createContext<string | undefined>(undefined)

export function NonceProvider({ nonce, children }: Props) {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
}

export function useCspNonce() {
  return useContext(NonceContext)
}
