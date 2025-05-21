"use client"

import { useEffect, useState } from "react"

export function LoginMessage() {
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    // Get the current URL
    const url = new URL(window.location.href)
    const fromSearch = url.searchParams.get('from') === 'search'
    
    console.log('Login message - URL check:', { url: window.location.href, fromSearch })
    
    // Only show message if URL parameter is present
    setShowMessage(fromSearch)
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
