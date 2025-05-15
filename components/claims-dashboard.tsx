"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface Claim {
  id: string
  company: string
  startDate: string
  stage: string
  stageStartDate: string
  expectedAmount: number
  expectedResolutionDate: string
  status: "Submitted" | "Signed" | "In Progress" | "Under Review" | "Approved" | "Rejected"
}

export function ClaimsDashboard() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchClaims = async () => {
      try {
        // In a real app, this would be a fetch call to your API
        // const response = await fetch("/api/claims")
        // const data = await response.json()

        // Simulated response data
        const data = [
          {
            id: "1",
            company: "CarFinance Ltd",
            startDate: "15/06/2023",
            stage: "Documentation Review",
            stageStartDate: "20/06/2023",
            expectedAmount: 3250,
            expectedResolutionDate: "15/09/2023",
            status: "In Progress",
          },
          {
            id: "2",
            company: "Auto Loans Direct",
            startDate: "02/07/2023",
            stage: "Lender Assessment",
            stageStartDate: "10/07/2023",
            expectedAmount: 2800,
            expectedResolutionDate: "02/10/2023",
            status: "Under Review",
          },
          {
            id: "3",
            company: "Premier Vehicle Finance",
            startDate: "25/05/2023",
            stage: "Final Decision",
            stageStartDate: "30/07/2023",
            expectedAmount: 4150,
            expectedResolutionDate: "25/08/2023",
            status: "Approved",
          },
        ]

        setClaims(data)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching claims:", error)
        setIsLoading(false)
      }
    }

    fetchClaims()
  }, [])

  const getStatusColor = (status: Claim["status"]) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-100 text-blue-800"
      case "Signed":
        return "bg-purple-100 text-purple-800"
      case "In Progress":
        return "bg-amber-100 text-amber-800"
      case "Under Review":
        return "bg-orange-100 text-orange-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#55c0c0] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
            Loading your claims...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {claims.length === 0 ? (
        <Card className="border-0 bg-[#3a444d] shadow-sm rounded-md">
          <CardContent className="p-6 text-center">
            <p className="text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
              You don't have any active claims yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id} className="relative border-0 bg-[#3a444d] shadow-sm rounded-md mx-0">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Header with company name and status badge */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {claim.company}
                    </h3>
                    <Badge className={`${getStatusColor(claim.status)} rounded-md`}>{claim.status}</Badge>
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
      )}
    </div>
  )
}

