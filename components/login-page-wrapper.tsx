"use client"

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from "react"
import { LoginForm } from "@/components/login-form"

console.log('LOGIN PAGE WRAPPER - Module initialization')

export function LoginPageWrapper() {
  console.log('LOGIN PAGE WRAPPER - Component rendering')
  
  const searchParams = useSearchParams()
  console.log('LOGIN PAGE WRAPPER - Search params:', searchParams?.toString())
  
  const [showMessage, setShowMessage] = useState(false)
  console.log('LOGIN PAGE WRAPPER - Initial state:', { showMessage })

  // Log window object availability
  console.log('LOGIN PAGE WRAPPER - Window object available:', typeof window !== 'undefined')
  
  // Log document object availability
  console.log('LOGIN PAGE WRAPPER - Document object available:', typeof document !== 'undefined')

  useEffect(() => {
    console.log('LOGIN PAGE WRAPPER - useEffect running')
    
    try {
      // Check URL parameter
      const fromParam = searchParams?.get('from')
      const fromSearch = fromParam === 'search'
      console.log('LOGIN PAGE WRAPPER - URL params check:', { fromParam, fromSearch })
      
      // Check localStorage
      let contactID = null
      let leadID = null
      
      try {
        contactID = localStorage.getItem('contactID')
        leadID = localStorage.getItem('leadID')
        console.log('LOGIN PAGE WRAPPER - localStorage check:', { contactID, leadID })
      } catch (error) {
        console.error('LOGIN PAGE WRAPPER - localStorage error:', error)
      }
      
      const shouldShowMessage = fromSearch || contactID !== null || leadID !== null
      console.log('LOGIN PAGE WRAPPER - Should show message:', shouldShowMessage)
      
      setShowMessage(shouldShowMessage)
    } catch (error) {
      console.error('LOGIN PAGE WRAPPER - General error in useEffect:', error)
    }
  }, [searchParams])

  return (
    <>
      {showMessage && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
          <p className="text-sm">
            We've already searched for credit agreements using these details.
            Please log in to access the information.
          </p>
        </div>
      )}
      <LoginForm />
    </>
  )
}
