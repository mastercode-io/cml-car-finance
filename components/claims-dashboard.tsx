"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface Claim {
  id: string
  company: string
  startDate: string
  stage: string
  stageStartDate: string
  expectedAmount: number
  expectedResolutionDate: string
}

interface ClaimsDashboardProps {
  claims: Claim[];
}

export function ClaimsDashboard({ claims }: ClaimsDashboardProps) {
  // If there are no claims, show a message
  if (claims.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white text-lg" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
          You do not have active claims.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <Card key={claim.id} className="relative border-0 bg-[#3a444d] shadow-sm rounded-md">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Header with company name */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {claim.company}
                </h3>
              </div>

              {/* Claim details in grid layout */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        Claim Started
                      </p>
                      <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        {claim.startDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        Current Stage
                      </p>
                      <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        {claim.stage}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        Stage Started
                      </p>
                      <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        {claim.stageStartDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        Expected Amount
                      </p>
                      <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        £{claim.expectedAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                      Expected Resolution
                    </p>
                    <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                      {claim.expectedResolutionDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

