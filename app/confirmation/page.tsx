"use client"

import { LogoHeader } from "@/components/logo-header"

export default function ConfirmationPage() {
  return (
    <main className="bg-white">
      <LogoHeader />
      <div className="container px-4 md:px-6 pt-4 pb-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="text-center">
            <h1
              className="text-3xl font-bold tracking-tight text-black sm:text-4xl"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Claim Submitted
            </h1>
            <div className="mt-2 mx-auto w-40 h-1 bg-[#55c0c0]"></div>
          </div>
          
          <div className="bg-[#2a343d] p-8 rounded-md text-center">
            <div className="mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#55c0c0" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p 
              className="text-xl text-white mb-4" 
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Thank You!
            </p>
            <p 
              className="text-gray-300 mb-2" 
              style={{ fontFamily: '"Source Sans Pro", sans-serif' }}
            >
              We sent you the documents required to process your claim.
            </p>
            <p 
              className="text-gray-300 mb-2" 
              style={{ fontFamily: '"Source Sans Pro", sans-serif' }}
            >
              Please check your email and text messages.
            </p>
            <p 
              className="text-gray-300" 
              style={{ fontFamily: '"Source Sans Pro", sans-serif' }}
            >
              We will start the litigation as soon as we receive signed documents.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
