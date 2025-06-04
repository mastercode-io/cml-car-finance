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
      const response = await fetch("/.netlify/functions/portal-access-request", {
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
              <Card className="w-full bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">Thank You</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-gray-700">Thank you for completing your web portal application.</p>
                    <p className="text-gray-700">Our team will review the information and get in touch via email or phone if needed.</p>
                    <p className="text-sm text-gray-500 mt-6">
                      For any queries, visit <a href="https://www.claimmyloss.co.uk" className="text-blue-600 hover:underline">www.claimmyloss.co.uk</a> or email <a href="mailto:fsclaims@htlegal.co.uk" className="text-blue-600 hover:underline">fsclaims@htlegal.co.uk</a>
                    </p>
                    <Button 
                      onClick={() => router.push("/login?fromPortalAccess=true")} 
                      className="mt-6 bg-[#e52e3d] text-white hover:bg-[#c52535] border-0 rounded-md h-10 text-sm"
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
            <Card className="w-full bg-white shadow-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Set up my claims portal</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  Please provide your details to request portal access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your first name" 
                                className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your last name" 
                                className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email address" 
                              className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your phone number" 
                              className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel className="text-gray-700">Claim Types</FormLabel>
                      <div className="grid grid-cols-1 gap-2 mt-1">
                        {claimTypes.map((type) => (
                          <FormField
                            key={type.id}
                            control={form.control}
                            name="claimTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={type.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
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
                                      className="data-[state=checked]:bg-[#e52e3d] data-[state=checked]:border-[#e52e3d]"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal text-gray-700">
                                    {type.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage className="text-red-500">
                        {form.formState.errors.claimTypes?.message}
                      </FormMessage>
                    </div>
                    
                    {error && (
                      <div className="text-red-500 text-sm">{error}</div>
                    )}
                    
                    <div className="flex flex-col space-y-2 mt-6">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-[#e52e3d] text-white hover:bg-[#c52535] border-0 rounded-md h-10 text-sm"
                      >
                        {isSubmitting ? "Processing..." : "Continue"}
                      </Button>
                      <Link 
                        href="/login" 
                        className="text-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        Go Back
                      </Link>
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
