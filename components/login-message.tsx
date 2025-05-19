"use client"

import { useEffect, useState } from "react"

export function LoginMessage() {
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    // Get the current URL
    const url = new URL(window.location.href)
    const fromSearch = url.searchParams.get('from') === 'search'
    
    console.log('Login message - URL check:', { url: window.location.href, fromSearch })
    
    // Check localStorage as a fallback
    const contactID = localStorage.getItem('contactID')
    const leadID = localStorage.getItem('leadID')
    
    console.log('Login message - localStorage check:', { contactID, leadID })
    
    // Show message if either condition is true
    setShowMessage(fromSearch || contactID !== null || leadID !== null)
  }, [])

  if (!showMessage) return null

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
      <p className="text-sm">
        We've already searched for credit agreements using these details.
        Please log in to access the information.
      </p>
    </div>
  )
}
