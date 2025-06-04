"use client"

import { useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { LogoHeader } from "@/components/logo-header"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const fromSearch = searchParams.get("fromSearch") === "true"
  const fromPortalAccess = searchParams.get("fromPortalAccess") === "true"
  return (
    <main className="bg-white min-h-screen flex flex-col">
      <LogoHeader />
      <div className="flex-1 flex items-center justify-center py-8 mb-[10vh]">
        <div className="w-full px-4 md:px-6">
          <div className="mx-auto max-w-md">
            {/* Message only shown when redirected from search page */}
            {fromSearch && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                <p className="text-sm">
                  We've already searched for credit agreements using these details.
                  Please log in to access the information.
                </p>
              </div>
            )}
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}

