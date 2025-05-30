"use client"

import { useEffect, useState, useRef } from "react"
import { ClaimsDashboard } from "@/components/claims-dashboard"
import { LogoHeader } from "@/components/logo-header"
import { redirectIfNotAuthenticated } from "@/utils/session"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Claim {
  id: string
  company: string
  startDate: string
  stage: string
  stageStartDate: string
  expectedAmount: number
  expectedResolutionDate: string
}

export default function DashboardPage() {
  const [openClaims, setOpenClaims] = useState<Claim[]>([]);
  const [closedClaims, setClosedClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSectionCollapsed, setOpenSectionCollapsed] = useState(false);
  const [closedSectionCollapsed, setClosedSectionCollapsed] = useState(true);
  
  // Use a ref to track if we've already fetched data to prevent duplicate requests
  const hasFetchedRef = useRef(false);

  // Check if user is authenticated and fetch claims data on page load
  useEffect(() => {
    // Log session data for debugging
    const sessionToken = localStorage.getItem('sessionToken');
    const userModule = localStorage.getItem('userModule');
    const sessionExpires = localStorage.getItem('sessionExpires');
    
    console.log('[Dashboard] Session check on load:', { 
      hasSessionToken: !!sessionToken,
      hasUserModule: !!userModule,
      hasSessionExpires: !!sessionExpires,
      sessionTokenPrefix: sessionToken ? sessionToken.substring(0, 10) + '...' : 'none',
      userModule,
      sessionExpires: sessionExpires ? new Date(parseInt(sessionExpires, 10)).toISOString() : 'none',
      currentTime: new Date().toISOString(),
      isExpired: sessionExpires ? Date.now() > parseInt(sessionExpires, 10) : true
    });
    
    // Redirect to login page if not authenticated
    const redirected = redirectIfNotAuthenticated();
    console.log('[Dashboard] Redirect result:', redirected ? 'Redirected to login' : 'Authenticated');
    
    // If authenticated, fetch claims data
    if (!redirected && !hasFetchedRef.current) {
      fetchClaimsData();
    }
  }, []);
  
  // Function to fetch claims data
  const fetchClaimsData = async () => {
    // Only run this if we haven't already fetched data
    if (hasFetchedRef.current) {
      console.log('[Dashboard] Skipping duplicate fetch - already fetched');
      return;
    }
    
    // Mark that we've started fetching
    hasFetchedRef.current = true;
    
    // Generate a unique request ID to track requests
    const requestId = Math.random().toString(36).substring(2, 10);
    console.log(`[Dashboard] Starting claims fetch (request ID: ${requestId})`);
    
    try {
      // Get the session token from localStorage
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        console.log('[Dashboard] No session token found');
        setError('Your session has expired. Please log in again.');
        setIsLoading(false);
        return;
      }

      console.log('[Dashboard] Making API request with token:', sessionToken.substring(0, 10) + '...');
      
      // Call the get-claims API endpoint with the authorization header
      const response = await fetch('/.netlify/functions/get-claims', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      console.log(`[Dashboard] API response (request ID: ${requestId}):`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()])
      });

      const data = await response.json();
      console.log(`[Dashboard] Response data (request ID: ${requestId}):`, data);

      if (!response.ok) {
        // Handle error responses
        if (response.status === 401 || response.status === 403) {
          const errorMsg = data.message || 'Your session has expired or you do not have permission to access this data.';
          console.error(`[Dashboard] Auth error (request ID: ${requestId}):`, errorMsg);
          setError(errorMsg);
        } else {
          const errorMsg = data.message || 'An error occurred while fetching your claims data.';
          console.error(`[Dashboard] API error (request ID: ${requestId}):`, errorMsg);
          setError(errorMsg);
        }
        setOpenClaims([]);
        setClosedClaims([]);
        setIsLoading(false); // Ensure loading state is turned off for error responses
      } else {
        // Handle successful response
        console.log('Claims data response:', data);
        
        // Check if data is in the expected format
        // Zoho might return data in different formats, so we need to handle various possibilities
        let claimsData = data;
        
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
          
          // Separate claims into open and closed based on stage
          // For this example, we'll consider claims with stage 'Completed' or 'Closed' as closed claims
          const open: Claim[] = [];
          const closed: Claim[] = [];
          
          fetchedClaims.forEach(claim => {
            if (claim.stage === 'Completed' || claim.stage === 'Closed') {
              closed.push(claim);
            } else {
              open.push(claim);
            }
          });
          
          setOpenClaims(open);
          setClosedClaims(closed);
        } else {
          // Empty claims arrays
          setOpenClaims([]);
          setClosedClaims([]);
        }
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('Unable to connect to the claims service. Please try again later.');
      setOpenClaims([]);
      setClosedClaims([]);
    } finally {
      setIsLoading(false);
      console.log(`[Dashboard] Fetch completed (request ID: ${requestId})`);
    }
  };

  // Toggle section collapse for open claims
  const toggleOpenCollapse = () => {
    setOpenSectionCollapsed(!openSectionCollapsed);
  };

  // Toggle section collapse for closed claims
  const toggleClosedCollapse = () => {
    setClosedSectionCollapsed(!closedSectionCollapsed);
  };
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

          {/* Summary Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {/* Open Claims Widget */}
            <div className="bg-[#2a343d] rounded-md p-4 text-white border-l-4 border-[#55c0c0]">
              <p className="text-sm font-medium text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Open Claims</p>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Number of claims</p>
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>{openClaims.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Total claimed amount</p>
                  <p className="text-lg text-[#ffeb00]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    £{openClaims.reduce((total, claim) => total + claim.expectedAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Closed Claims Widget */}
            <div className="bg-[#2a343d] rounded-md p-4 text-white border-l-4 border-[#47a3a3]">
              <p className="text-sm font-medium text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Closed Claims</p>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Number of claims</p>
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>{closedClaims.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Total settlement received</p>
                  <p className="text-lg text-[#55c0c0]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    £{closedClaims.reduce((total, claim) => total + claim.expectedAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Open Claims Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-medium tracking-tight text-black" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Open Claims
                </h2>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#55c0c0] text-white">
                  {openClaims.length}
                </span>
              </div>
              <button 
                onClick={toggleOpenCollapse} 
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={openSectionCollapsed ? "Expand section" : "Collapse section"}
              >
                {openSectionCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          
          {!openSectionCollapsed && (
            <div className="bg-[#2a343d] p-6 rounded-md mb-8">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : error ? (
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
              ) : (
                <ClaimsDashboard claims={openClaims} />
              )}
            </div>
          )}
          
          {/* Closed Claims Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-medium tracking-tight text-black" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Closed Claims
                </h2>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#55c0c0] text-white">
                  {closedClaims.length}
                </span>
              </div>
              <button 
                onClick={toggleClosedCollapse} 
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={closedSectionCollapsed ? "Expand section" : "Collapse section"}
              >
                {closedSectionCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          
          {!closedSectionCollapsed && (
            <div className="bg-[#2a343d] p-6 rounded-md">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : error ? (
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
              ) : (
                <ClaimsDashboard claims={closedClaims} />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

