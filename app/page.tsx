import { CreditSearchForm } from "@/components/credit-search-form"
import { CarFinanceBanner } from "@/components/car-finance-banner"
import { LogoHeader } from "@/components/logo-header"

export default function Home() {
  return (
    <main className="bg-white">
      <LogoHeader />
      <div className="container px-4 md:px-6 pt-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <CarFinanceBanner />
          
          <div className="mb-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2a343d]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Free Mis-Sold Car Finance Claim Checker
              </h3>
              <p className="mt-2 text-[#2a343d]" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                We'll give you an instant answer on whether you can claim and how much you might receive. We estimate the average claim value to be between £1,200 and £1,600.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[#2a343d]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                We've Made This Process as Simple as Possible for You:
              </h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[#55c0c0] font-semibold flex-shrink-0" style={{ fontFamily: "Montserrat, sans-serif" }}>1.</span>
                  <span style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                    Add your name and address details below
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#55c0c0] font-semibold flex-shrink-0" style={{ fontFamily: "Montserrat, sans-serif" }}>2.</span>
                  <span style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                    Our soft search will show you all the agreements you've had in the last 6 years
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#55c0c0] font-semibold flex-shrink-0" style={{ fontFamily: "Montserrat, sans-serif" }}>3.</span>
                  <span style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                    We will tell you if you can make a claim and give an estimate on what you might receive
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#55c0c0] font-semibold flex-shrink-0" style={{ fontFamily: "Montserrat, sans-serif" }}>4.</span>
                  <span style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                    You then choose whether you want to appoint us to manage your claim and represent you
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <CreditSearchForm />
        </div>
      </div>
    </main>
  )
}

