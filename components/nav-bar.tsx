'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()
  
  return (
    <nav className="bg-[#2a343d] text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex gap-4">
          <Link 
            href="/" 
            className={cn(
              "hover:text-[#55c0c0] transition-colors",
              pathname === '/' && "text-[#55c0c0]"
            )}
          >
            Home
          </Link>
        </div>
      </div>
    </nav>
  )
} 