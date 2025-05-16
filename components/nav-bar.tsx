'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()
  
  return (
    <nav className="bg-[#2a343d] text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex gap-6">
          <Link 
            href="/" 
            className={cn(
              "hover:text-[#55c0c0] transition-colors",
              pathname === '/' && "text-[#55c0c0]"
            )}
          >
            Login
          </Link>
          <Link 
            href="/dashboard" 
            className={cn(
              "hover:text-[#55c0c0] transition-colors",
              pathname === '/dashboard' && "text-[#55c0c0]"
            )}
          >
            Dashboard
          </Link>
          <Link 
            href="/search" 
            className={cn(
              "hover:text-[#55c0c0] transition-colors",
              pathname === '/search' && "text-[#55c0c0]"
            )}
          >
            Credit Search
          </Link>
          <Link 
            href="/loans" 
            className={cn(
              "hover:text-[#55c0c0] transition-colors",
              pathname === '/loans' && "text-[#55c0c0]"
            )}
          >
            Loans
          </Link>
        </div>
      </div>
    </nav>
  )
} 