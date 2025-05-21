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

export function ClaimsDashboard() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use a ref to track if we've already fetched data to prevent duplicate requests
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only run this effect once
    if (hasFetchedRef.current) {
      console.log('[ClaimsDashboard] Skipping duplicate fetch - already fetched');
      return;
    }
    
    // Mark that we've started fetching
    hasFetchedRef.current = true;
    
    // Generate a unique request ID to track requests
    const requestId = Math.random().toString(36).substring(2, 10);
    console.log(`[ClaimsDashboard] Starting claims fetch (request ID: ${requestId})`);
    
    const fetchClaims = async () => {
      try {
        // Get the session token from localStorage
        const sessionToken = localStorage.getItem('sessionToken');
        const userModule = localStorage.getItem('userModule');
        const sessionExpires = localStorage.getItem('sessionExpires');
        
        console.log('[ClaimsDashboard] Session data before API call:', { 
          hasSessionToken: !!sessionToken,
          hasUserModule: !!userModule,
          hasSessionExpires: !!sessionExpires,
          sessionTokenPrefix: sessionToken ? sessionToken.substring(0, 10) + '...' : 'none',
          userModule,
          sessionExpires: sessionExpires ? new Date(parseInt(sessionExpires, 10)).toISOString() : 'none',
          currentTime: new Date().toISOString()
        });
        
        if (!sessionToken) {
          console.log('[ClaimsDashboard] No session token found');
          setError('Your session has expired. Please log in again.');
          setIsLoading(false);
          return;
        }

        console.log('[ClaimsDashboard] Making API request with token:', sessionToken.substring(0, 10) + '...');
        
        // Call the get-claims API endpoint with the authorization header
        const response = await fetch('/.netlify/functions/get-claims', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        console.log(`[ClaimsDashboard] API response (request ID: ${requestId}):`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()])
        });

        const data = await response.json();
        console.log(`[ClaimsDashboard] Response data (request ID: ${requestId}):`, data);

        if (!response.ok) {
          // Handle error responses
          if (response.status === 401 || response.status === 403) {
            const errorMsg = data.message || 'Your session has expired or you do not have permission to access this data.';
            console.error(`[ClaimsDashboard] Auth error (request ID: ${requestId}):`, errorMsg);
            setError(errorMsg);
          } else {
            const errorMsg = data.message || 'An error occurred while fetching your claims data.';
            console.error(`[ClaimsDashboard] API error (request ID: ${requestId}):`, errorMsg);
            setError(errorMsg);
          }
          setClaims([]);
          setIsLoading(false); // Ensure loading state is turned off for error responses
        } else {
          // Handle successful response
          console.log('Claims data response:', data);
          
          // Check if data is in the expected format
          // Zoho might return data in different formats, so we need to handle various possibilities
          let claimsData = data;
          
          console.log('Claims data response:', data);
          
          // If data is a string that looks like JSON objects without array brackets
          if (typeof data === 'string' && data.includes('},{')) {
            try {
              console.log('Attempting to parse string data as JSON array');
              claimsData = JSON.parse(`[${data}]`);
            } catch (e) {
              console.error('Error parsing claims data string:', e);
            }
          }
          
          // If data is wrapped in a data property (common Zoho format)
          if (!Array.isArray(claimsData) && claimsData?.data) {
            claimsData = claimsData.data;
          }
          
          // If data is wrapped in a claims property
          if (!Array.isArray(claimsData) && claimsData?.claims) {
            claimsData = claimsData.claims;
          }
          
          // If claimsData is a single object (not an array), convert it to an array
          if (!Array.isArray(claimsData) && typeof claimsData === 'object' && claimsData !== null) {
            claimsData = [claimsData];
          }
          
          if (Array.isArray(claimsData) && claimsData.length > 0) {
            // Map the API response to our Claim interface
            const fetchedClaims = claimsData.map((item: any) => ({
              id: item.id || `claim-${Math.random().toString(36).substr(2, 9)}`,
              company: item.company || 'Unknown Company',
              startDate: item.startDate || 'N/A',
              stage: item.stage || 'Processing',
              stageStartDate: item.stageStartDate || 'N/A',
              expectedAmount: parseFloat(item.expectedAmount) || 0,
              expectedResolutionDate: item.expectedResolutionDate || 'To be determined'
            }));
            setClaims(fetchedClaims);
          } else {
            // Empty claims array
            setClaims([]);
          }
        }
      } catch (err) {
        console.error('Error fetching claims:', err);
        setError('Unable to connect to the claims service. Please try again later.');
        setClaims([]);
      } finally {
        setIsLoading(false);
        console.log(`[ClaimsDashboard] Fetch completed (request ID: ${requestId})`);
      }
    };

    fetchClaims();
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-white text-lg mb-4" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
          {error}
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 text-base font-medium text-white bg-[#55c0c0] hover:bg-[#47a3a3] border-0 rounded-md h-12"
          style={{ fontFamily: '"Source Sans Pro", sans-serif' }}
        >
          Go to Login
        </a>
      </div>
    )
  }

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

