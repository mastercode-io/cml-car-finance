import Image from 'next/image'

export function CarFinanceBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl mb-8">
      {/* Background Image */}
      <div className="relative w-full h-[500px] md:h-[600px]">
        <Image
          src="/images/car-finance-claim-check.png"
          alt="Car Finance Claim"
          fill
          className="object-cover"
          priority
        />
        {/* Semi-transparent overlay */}
        <div className="absolute inset-[10%] bg-gray-200/60 rounded-lg flex items-center">
          {/* Text content */}
          <div className="p-6 md:p-8 lg:p-12 text-gray-900 max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 md:mb-6 text-center">
              Have You Bought a Vehicle Using Finance Before January 2021?
            </h2>
            <div className="space-y-4 text-xs md:text-sm lg:text-base">
              <p className="mb-4">
                Find out if you could be entitled to thousands of pounds in compensation using our agreement finder today.
              </p>
              <p className="mb-4">
                We are an established firm of solicitors based in South Manchester, specializing in complex financial services claims.
              </p>
              <p>
                Car finance claims involve sending individual complaint letters to each car finance provider you've used over the last 12 years. We offer a no-win no-fee claim management service for those who may not feel comfortable handling complaints or claims on their own.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 