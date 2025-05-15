"use client"

import { useEffect, useState } from "react"
import { CarLoansSelection } from "@/components/car-loans-selection"
import { LogoHeader } from "@/components/logo-header"

interface CreditSearchResponse {
  result: {
    clientReference: string;
    experianStatus: string;
    claimsProcessed: number;
    leadID: string;
  };
  code: number;
}

export default function LoansPage() {
  const [creditSearchResponse, setCreditSearchResponse] = useState<CreditSearchResponse | null>(null);

  useEffect(() => {
    // Retrieve the credit search response from localStorage
    const storedResponse = localStorage.getItem('creditSearchResponse');
    if (storedResponse) {
      setCreditSearchResponse(JSON.parse(storedResponse));
    }
  }, []);

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
              Your Car Loans
            </h1>
            <div className="mt-2 mx-auto w-40 h-1 bg-[#55c0c0]"></div>
            <p className="mt-6 text-lg text-gray-600" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
              Select the loans you'd like to make a claim for
            </p>
          </div>
          <div className="bg-[#2a343d] p-6 rounded-md">
            <CarLoansSelection />
          </div>
        </div>
      </div>
    </main>
  )
}

