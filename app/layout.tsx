import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DevMenu } from "@/components/dev-menu"
import { GetInTouch } from "@/components/get-in-touch"

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
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap"
        />
      </head>
      <body className={inter.className}>
        <DevMenu />
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">{children}</div>
          <GetInTouch />
        </div>
      </body>
    </html>
  )
}

import './globals.css'