import { MapPin } from "lucide-react"

export function GetInTouch() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#55c0c0] text-white py-2">
      <div className="px-4 md:px-6">
        <div className="flex items-start gap-2 text-xs" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            HT Legal Financial Services Claims,
            <br />
            Craven Business Centre, 4-5 Craven Court,
            <br />
            Craven Road, Altrincham WA14 5DY
          </div>
        </div>
      </div>
    </div>
  )
}

