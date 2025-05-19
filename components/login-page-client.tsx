"use client"

import { LoginForm } from './login-form'

export default function LoginPageClient() {
  // Log everything we can about the current environment
  console.log('Login page client rendering')
  console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'window not available')
  
  // Always show the message, no conditions
  return (
    <>
      {/* Always show the message */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
        <p className="text-sm">
          We've already searched for credit agreements using these details.
          Please log in to access the information.
        </p>
      </div>
      <LoginForm />
    </>
  )
}
