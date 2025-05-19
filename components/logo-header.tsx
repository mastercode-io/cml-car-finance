"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'

export function LogoHeader() {
  const [topPosition, setTopPosition] = useState("top-0")
  
  useEffect(() => {
    // Check if DEV_MODE environment variable is set to 'true'
    // Access environment variables safely
    if (typeof window !== 'undefined') {
      const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
      setTopPosition(devMode ? "top-[40px]" : "top-0")
    }
  }, [])
  
  return (
    <div className={`sticky ${topPosition} bg-gray-50 z-40 py-4 shadow-sm`}>
      <div className="px-4 md:px-6 flex justify-between items-center">
        {/* CML Logo */}
        <div className="relative h-[70px] w-[200px]">
          <Image
            src="/images/cml-logo.png"
            alt="Claim My Loss"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        
        {/* SRA Logo */}
        <div className="relative h-[70px] w-[200px]">
          <Image
            src="/images/SRA-Logo.jpg"
            alt="Solicitors Regulation Authority"
            fill
            className="object-contain object-right"
            priority
          />
        </div>
      </div>
    </div>
  )
} 