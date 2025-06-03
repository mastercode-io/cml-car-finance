"use client"

import { useEffect, useState, useRef } from "react"
import { ClaimsDashboard } from "@/components/claims-dashboard"
import { LogoHeader } from "@/components/logo-header"
import { redirectIfNotAuthenticated } from "@/utils/session"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Claim {
  id: string
  provider: string
  startDate: string
  stage: string
  sub_status: string
  stageStartDate: string
  potentialAmount: number
  expectedResolutionDate: string
}

interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  mobile: string
  referenceNumber: string
}

interface ApiResponse {
  contactInfo: ContactInfo
  claimList: Claim[]
}

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSectionCollapsed, setOpenSectionCollapsed] = useState(false);
  const [closedSectionCollapsed, setClosedSectionCollapsed] = useState(true);
  
  // Use a ref to track if we've already fetched data to prevent duplicate requests
  const hasFetchedRef = useRef(false);

  // Separate claims into open and closed (for now, all claims are considered "open" since API doesn't specify status)
  const openClaims = claims; // All claims from API are treated as open for now
  const closedClaims: Claim[] = []; // Empty for now since API doesn't provide closed claims

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
    
    if (!redirected) {
      // Only fetch data if user is authenticated
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
        setClaims([]);
        setContactInfo(null);
        setIsLoading(false);
      } else {
        // Handle successful response
        console.log('Claims data response:', data);
        
        // The API should return the response in the format: { contactInfo: {...}, claimList: [...] }
        let apiResponse: ApiResponse;
        
        // Handle different possible response formats
        if (Array.isArray(data)) {
          // If data is an array, take the first item
          apiResponse = data[0] as ApiResponse;
        } else {
          // If data is already an object
          apiResponse = data as ApiResponse;
        }
        
        if (apiResponse && apiResponse.claimList && Array.isArray(apiResponse.claimList)) {
          // Set the contact info
          if (apiResponse.contactInfo) {
            setContactInfo(apiResponse.contactInfo);
          }
          
          // Set the claims data
          setClaims(apiResponse.claimList);
          console.log(`[Dashboard] Successfully loaded ${apiResponse.claimList.length} claims`);
        } else {
          console.log('[Dashboard] No claims found in response');
          setClaims([]);
          setContactInfo(null);
        }
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('Unable to connect to the claims service. Please try again later.');
      setClaims([]);
      setContactInfo(null);
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

  // Show loading state
  if (isLoading) {
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
                Loading your claims data...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
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
              <p className="mt-6 text-lg text-red-600" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
            {contactInfo && (
              <p className="mt-2 text-sm text-gray-500" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                Welcome back, {contactInfo.firstName} {contactInfo.lastName} (Ref: {contactInfo.referenceNumber})
              </p>
            )}
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
                  <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Total potential amount</p>
                  <p className="text-lg text-[#ffeb00]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    £{openClaims.reduce((total, claim) => total + claim.potentialAmount, 0).toLocaleString()}
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
                    £{closedClaims.reduce((total, claim) => total + (claim.potentialAmount || 0), 0).toLocaleString()}
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
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="text-sm" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                  {openSectionCollapsed ? 'Show' : 'Hide'}
                </span>
                {openSectionCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {!openSectionCollapsed && (
              <div className="mt-4">
                <ClaimsDashboard claims={openClaims} />
              </div>
            )}
          </div>

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
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="text-sm" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                  {closedSectionCollapsed ? 'Show' : 'Hide'}
                </span>
                {closedSectionCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {!closedSectionCollapsed && (
              <div className="mt-4">
                <ClaimsDashboard claims={closedClaims} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
