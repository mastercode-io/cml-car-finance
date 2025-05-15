import Image from 'next/image'

export function LogoHeader() {
  return (
    <div className="sticky top-[40px] bg-gray-50 z-40 py-4 shadow-sm">
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