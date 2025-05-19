"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface Loan {
  Status: string;
  Monthly_Payment: number;
  Last_Update: string;
  Account_Type: string;
  Company_Type: string;
  CRM_Lead: string;
  Opening_Balance: number;
  Current_Balance: number;
  Name: string;
  Provider: string;
  Settlement_Date?: string;
  Worst_Status: string;
  Personal_Address: string;
  Finance_Company: string;
  Source_Code: string;
  Currency: string;
  Client_Reference: string;
  Account_No: string;
  Start_Date: string;
  Repayment_Period: string;
  carClaimID: string;
}

export function CarLoansSelection() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [selectedLoans, setSelectedLoans] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leadID, setLeadID] = useState("")
  const [contactID, setContactID] = useState("")

  useEffect(() => {
    // Get the credit search response from localStorage
    const storedResponse = localStorage.getItem('creditSearchResponse');
    if (storedResponse) {
      try {
        const data = JSON.parse(storedResponse);
        if (data.result?.claimList) {
          setLoans(data.result.claimList);
        }
        if (data.result?.leadID) {
          setLeadID(data.result.leadID);
        }
        if (data.result?.contactID) {
          setContactID(data.result.contactID);
        }
      } catch (error) {
        console.error('Error parsing credit search response:', error);
      }
    }
    setIsLoading(false);
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLoans(loans.map((loan) => loan.carClaimID))
    } else {
      setSelectedLoans([])
    }
  }

  const handleSelectLoan = (loanId: string, checked: boolean) => {
    if (checked) {
      setSelectedLoans([...selectedLoans, loanId])
    } else {
      setSelectedLoans(selectedLoans.filter((id) => id !== loanId))
    }
  }

  const handleNext = async () => {
    if (selectedLoans.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        leadID,
        contactID,
        carClaimIDs: selectedLoans
      };
      
      console.log("Submitting payload:", payload);
      
      const response = await fetch('/.netlify/functions/submit-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit claims');
      }
      
      // Redirect to confirmation page
      window.location.href = "/confirmation";
    } catch (error) {
      console.error("Error submitting claims:", error);
      alert("There was an error submitting your claims. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const allSelected = loans.length > 0 && selectedLoans.length === loans.length

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#55c0c0] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
            Loading your loans...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 flex items-center justify-center">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              className="h-4 w-4 border-white data-[state=checked]:bg-[#55c0c0] data-[state=checked]:border-[#55c0c0] rounded-[0.25rem]"
            />
          </div>
          <label
            htmlFor="select-all"
            className="text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Select All
          </label>
        </div>
        <Button
          onClick={handleNext}
          disabled={selectedLoans.length === 0 || isSubmitting}
          className="bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-10 px-6"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">Processing</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            </>
          ) : (
            "Next"
          )}
        </Button>
      </div>

      {loans.length === 0 ? (
        <Card className="border-0 bg-[#3a444d] shadow-sm rounded-md">
          <CardContent className="p-6 text-center">
            <p className="text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
              No loans found for your profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <Card key={loan.Account_No} className="relative border-0 bg-[#3a444d] shadow-sm rounded-md mx-0">
              <div className="absolute right-6 top-6">
                <div className="h-5 w-5 flex items-center justify-center">
                  <Checkbox
                    id={`loan-${loan.Account_No}`}
                    checked={selectedLoans.includes(loan.carClaimID)}
                    onCheckedChange={(checked) => handleSelectLoan(loan.carClaimID, checked as boolean)}
                    className="h-4 w-4 border-white data-[state=checked]:bg-[#55c0c0] data-[state=checked]:border-[#55c0c0] rounded-[0.25rem]"
                  />
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {loan.Finance_Company}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                      {loan.Name}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          Start Date
                        </p>
                        <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          {loan.Start_Date}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          {loan.Settlement_Date ? 'Settlement Date' : 'Status'}
                        </p>
                        <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          {loan.Settlement_Date || 'Current'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          Opening Balance
                        </p>
                        <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          £{loan.Opening_Balance.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          Monthly Payment
                        </p>
                        <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                          £{loan.Monthly_Payment}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        Address at time of loan
                      </p>
                      <p className="font-medium text-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        {loan.Personal_Address.replace(/\n/g, ', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loans.length > 0 && (
        <div className="flex justify-end pt-6">
          <Button
            onClick={handleNext}
            disabled={selectedLoans.length === 0}
            className="bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-10 px-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

