"use client"

import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { LogoHeader } from "@/components/logo-header"

// Create a client component that uses useSearchParams
function LoginContent() {
  const { useSearchParams } = require("next/navigation")
  const searchParams = useSearchParams()
  const fromSearch = searchParams.get("fromSearch") === "true"
  const fromPortalAccess = searchParams.get("fromPortalAccess") === "true"
  
  return (
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
  )
}

// Main page component with suspense boundary
export default function LoginPage() {
  return (
    <main className="bg-white min-h-screen flex flex-col">
      <LogoHeader />
      <div className="flex-1 flex items-center justify-center py-8 mb-[10vh]">
        <div className="w-full px-4 md:px-6">
          <Suspense fallback={<div className="mx-auto max-w-md">Loading...</div>}>
            <LoginContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
