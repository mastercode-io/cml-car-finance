import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { Inter } from "next/font/google"
import "./globals.css"
import { DevMenu } from "@/components/dev-menu"
import { GetInTouch } from "@/components/get-in-touch"
import { NonceProvider } from "@/components/security/nonce-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HT Legal",
  description: "HT Legal",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const nonce = headers().get("x-nonce") ?? undefined

  return (
    <html lang="en">
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap"
          nonce={nonce}
        />
      </head>
      <body className={inter.className}>
        <NonceProvider nonce={nonce}>
          <DevMenu />
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">{children}</div>
            <GetInTouch />
          </div>
        </NonceProvider>
      </body>
    </html>
  )
}

import './globals.css'