"use client"

import { useEffect, useState } from "react"
import { LoginForm } from "@/components/login-form"
import { LogoHeader } from "@/components/logo-header"

export default function Home() {
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    // Check URL parameter
    const searchParams = new URLSearchParams(window.location.search)
    const fromSearch = searchParams.get('from') === 'search'
    
    console.log('Root page - URL check:', { url: window.location.href, fromSearch })
    
    // Only show message if redirected from search page
    setShowMessage(fromSearch)
    
    // If we have the from=search parameter, we should also check localStorage
    // This helps ensure we're only showing the message when appropriate
    if (fromSearch) {
      console.log('User was redirected from search page')
      
      // Check if we have contactID and leadID in localStorage
      const contactID = localStorage.getItem('contactID')
      const leadID = localStorage.getItem('leadID')
      
      console.log('Root page - localStorage check:', { contactID, leadID })
    }
  }, [])

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <LogoHeader />
      <div className="flex-1 flex items-center justify-center py-8 mb-[10vh]">
        <div className="w-full px-4 md:px-6">
          <div className="mx-auto max-w-md">
            {showMessage && (
              <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-md text-gray-800">
                <p className="text-sm">
                  We've already searched for credit agreements using these details.
                  Please <span className="font-bold uppercase">log in</span> to access the information.
                </p>
              </div>
            )}
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}

