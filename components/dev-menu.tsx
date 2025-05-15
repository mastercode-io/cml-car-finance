"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function DevMenu() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Credit Search" },
    { href: "/loans", label: "Loans" },
    { href: "/login", label: "Login" },
    { href: "/dashboard", label: "Dashboard" },
  ]

  return (
    <div className="sticky top-0 z-50 w-full bg-[#1a242d] text-white shadow-md">
      <div className="container flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <span className="mr-4 text-sm font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
            DEV MODE
          </span>
        </div>
        <nav className="flex space-x-1 overflow-x-auto">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm transition-colors rounded-md ${
                  isActive ? "bg-[#55c0c0] text-white" : "text-gray-300 hover:bg-[#3a444d]"
                }`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

