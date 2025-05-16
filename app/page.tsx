import { LoginForm } from "@/components/login-form"
import { LogoHeader } from "@/components/logo-header"

export default function Home() {
  return (
    <main className="bg-white min-h-screen flex flex-col">
      <LogoHeader />
      <div className="flex-1 flex items-center justify-center py-8 mb-[10vh]">
        <div className="w-full px-4 md:px-6">
          <div className="mx-auto max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}

