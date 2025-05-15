"use client"

import { ClaimsDashboard } from "@/components/claims-dashboard"
import { LogoHeader } from "@/components/logo-header"

export default function DashboardPage() {
  return (
    <main className="bg-white">
      <LogoHeader />
      <div className="container px-4 md:px-6 pt-4 pb-16">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center">
            <h1
              className="text-3xl font-bold tracking-tight text-black sm:text-4xl"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Your Claims Dashboard
            </h1>
            <div className="mt-2 mx-auto w-40 h-1 bg-[#55c0c0]"></div>
            <p className="mt-6 text-lg text-gray-600" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
              Track the progress of your compensation claims
            </p>
          </div>
          <div className="bg-[#2a343d] p-6 rounded-md">
            <ClaimsDashboard />
          </div>
        </div>
      </div>
    </main>
  )
}

