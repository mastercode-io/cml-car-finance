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

// Function to check if a loan is eligible (start date before 31.12.2021)
const isLoanEligible = (startDate: string): boolean => {
  try {
    // Parse the start date - assuming format is DD/MM/YYYY or YYYY-MM-DD
    const parts = startDate.includes('/') 
      ? startDate.split('/').map(part => parseInt(part, 10))
      : startDate.split('-').map(part => parseInt(part, 10));
    
    let loanDate: Date;
    if (startDate.includes('/')) {
      // DD/MM/YYYY format
      loanDate = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
      // YYYY-MM-DD format
      loanDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }
    
    // Cutoff date: 31.12.2021
    const cutoffDate = new Date(2021, 11, 31); // Month is 0-indexed (11 = December)
    
    return loanDate <= cutoffDate;
  } catch (error) {
    console.error("Error parsing loan date:", error);
    return false; // If there's an error parsing the date, consider it ineligible
  }
};

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
      // Only select eligible loans (start date before 31.12.2021)
      const eligibleLoanIds = loans
        .filter(loan => isLoanEligible(loan.Start_Date))
        .map(loan => loan.carClaimID);
      setSelectedLoans(eligibleLoanIds);
    } else {
      setSelectedLoans([]);
    }
  }

  const handleSelectLoan = (loan: Loan, checked: boolean) => {
    // Check if loan is eligible before allowing selection
    if (!isLoanEligible(loan.Start_Date)) {
      return; // Don't allow selection of ineligible loans
    }
    
    if (checked) {
      setSelectedLoans([...selectedLoans, loan.carClaimID])
    } else {
      setSelectedLoans(selectedLoans.filter((id) => id !== loan.carClaimID))
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
      
      // Clear localStorage to remove loan information
      localStorage.removeItem('creditSearchResponse');
      
      // Redirect to confirmation page
      window.location.href = "/confirmation";
    } catch (error) {
      console.error("Error submitting claims:", error);
      alert("There was an error submitting your claims. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Count eligible loans for the "all selected" check
  const eligibleLoans = loans.filter(loan => isLoanEligible(loan.Start_Date));
  const allSelected = eligibleLoans.length > 0 && selectedLoans.length === eligibleLoans.length

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
      <div className="bg-[#3a444d] p-4 rounded-md mb-6">
        <p className="text-white text-center" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
          Only car loans issued before 31 December, 2021 can be claimed
        </p>
      </div>
      
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
            Select All Eligible Loans
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
          {loans.map((loan) => {
            // Determine if loan is eligible based on start date
            const isEligible = isLoanEligible(loan.Start_Date);
            return (
              <Card 
                key={loan.Account_No} 
                className={`relative border-0 shadow-sm rounded-md mx-0 ${
                  isEligible ? 'bg-[#3a444d]' : 'bg-[#2a343d] opacity-75'
                }`}
              >
                {!isEligible && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-[#1a242d] bg-opacity-70 px-3 py-1 rounded-md">
                      <p className="text-xs text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                        Ineligible - After 31/12/2021
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute right-6 top-6">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <Checkbox
                      id={`loan-${loan.Account_No}`}
                      checked={selectedLoans.includes(loan.carClaimID)}
                      onCheckedChange={(checked) => handleSelectLoan(loan, checked as boolean)}
                      disabled={!isEligible}
                      className="h-4 w-4 border-white data-[state=checked]:bg-[#55c0c0] data-[state=checked]:border-[#55c0c0] rounded-[0.25rem] disabled:opacity-50 disabled:cursor-not-allowed"
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
          );
          })}
        </div>
      )}

      {loans.length > 0 && (
        <div className="flex justify-end pt-6">
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
      )}
    </div>
  )
}

