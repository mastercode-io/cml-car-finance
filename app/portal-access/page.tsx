"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoHeader } from "@/components/logo-header"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

const claimTypes = [
  { id: "pensions", label: "Pensions & Investments" },
  { id: "financial-adviser", label: "Financial Adviser" },
  { id: "car-finance", label: "Car Finance" },
  { id: "irresponsible-lending", label: "Irresponsible Lending" },
  { id: "isa-claims", label: "ISA Claims" },
  { id: "bond-claims", label: "Bond Claims" },
  { id: "crypto-claims", label: "Crypto Claims" },
  { id: "sustainable-fund-claims", label: "Sustainable Fund Claims" },
  { id: "mortgage-claims", label: "Mortgage Claims" },
]

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
  mobile: z.string().regex(/^\+?[0-9]{10,15}$/, { message: "Please enter a valid phone number" }).optional(),
  claimTypes: z.array(z.string()).min(1, { message: "Please select at least one claim type" }),
}).refine(data => data.email || data.mobile, {
  message: "Either email or mobile number is required",
  path: ["email"],
})

export default function PortalAccessPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      claimTypes: [],
    },
  })

  useEffect(() => {
    // Get prefilled values from localStorage
    const email = localStorage.getItem("portalRequestEmail")
    const mobile = localStorage.getItem("portalRequestMobile")
    
    if (email) {
      form.setValue("email", email)
    }
    
    if (mobile) {
      form.setValue("mobile", mobile)
    }
    
    // Clear localStorage after using the values
    localStorage.removeItem("portalRequestEmail")
    localStorage.removeItem("portalRequestMobile")
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch("/.netlify/functions/portal-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })
      
      if (response.ok) {
        setIsSuccess(true)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to submit your request. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again later.")
      console.error("Error submitting portal access request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <main className="bg-white min-h-screen flex flex-col">
        <LogoHeader />
        <div className="flex-1 flex items-center justify-center py-8 mb-[10vh]">
          <div className="w-full px-4 md:px-6">
            <div className="mx-auto max-w-md">
              <Card className="w-full bg-[#2d3748] shadow-md border-0 rounded-md overflow-hidden">
                <CardHeader className="text-white text-center pb-4 pt-6 px-4 border-b border-gray-700">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Thank You</h1>
                    <div className="mt-2 mx-auto w-40 h-1 bg-[#55c0c0]"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Thank you for completing your web portal application.</p>
                    <p className="text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Our team will review the information and get in touch via email or phone if needed.</p>
                    <p className="text-sm text-gray-400 mt-6">
                      For any queries, visit <a href="https://www.claimmyloss.co.uk" className="text-[#55c0c0] hover:underline">www.claimmyloss.co.uk</a> or email <a href="mailto:fsclaims@htlegal.co.uk" className="text-[#55c0c0] hover:underline">fsclaims@htlegal.co.uk</a>
                    </p>
                    <Button 
                      onClick={() => router.push("/login?fromPortalAccess=true")} 
                      className="w-full mt-6 bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-12"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      Return to Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <LogoHeader />
      <div className="flex-1 flex items-center justify-center py-8 mb-[10vh]">
        <div className="w-full px-4 md:px-6">
          <div className="mx-auto max-w-md">
            <Card className="w-full bg-[#2d3748] shadow-md border-0 rounded-md overflow-hidden">
              <CardHeader className="text-white text-center pb-4 pt-6 px-4 border-b border-gray-700">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Set up my claims portal</h1>
                  <div className="mt-2 mx-auto w-40 h-1 bg-[#55c0c0]"></div>
                  <p className="mt-4 text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                    Please provide your details to request portal access
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your first name" 
                                className="bg-white border-0 rounded-md"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your last name" 
                                className="bg-white border-0 rounded-md"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email address" 
                              className="bg-white border-0 rounded-md"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your phone number" 
                              className="bg-white border-0 rounded-md"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-3">
                      <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Claim Types</FormLabel>
                      <div className="grid grid-cols-1 gap-3">
                        {claimTypes.map((type) => (
                          <FormField
                            key={type.id}
                            control={form.control}
                            name="claimTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={type.id}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, type.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== type.id
                                              )
                                            )
                                      }}
                                      className="border-white data-[state=checked]:bg-[#55c0c0] data-[state=checked]:border-[#55c0c0]"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                    {type.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage className="text-red-400">
                        {form.formState.errors.claimTypes?.message}
                      </FormMessage>
                    </div>
                    
                    {error && (
                      <div className="text-red-400 text-sm">{error}</div>
                    )}
                    
                    <div className="flex flex-col space-y-4 mt-6">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-12"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        {isSubmitting ? "Processing..." : "Continue"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push("/login")}
                        className="w-full mt-2 bg-[#55c0c0] text-white hover:bg-[#47a3a3] border-0 rounded-md h-10"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        Go Back
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
