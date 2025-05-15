"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }).optional(),
    mobile: z.string().min(10, { message: "Please enter a valid mobile number" }).optional(),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }).optional(),
  })
  .refine((data) => data.email || data.mobile, {
    message: "Either email or mobile is required",
    path: ["email"],
  })

export function LoginForm() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      mobile: "",
      otp: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (step === "credentials") {
      setIsLoading(true)
      // Simulate API call to send OTP
      setTimeout(() => {
        setIsLoading(false)
        setStep("otp")
      }, 1500)
    } else {
      setIsLoading(true)
      // Simulate API call to verify OTP
      setTimeout(() => {
        setIsLoading(false)
        // Redirect to dashboard on successful login
        window.location.href = "/dashboard"
      }, 1500)
    }
  }

  return (
    <Card className="border-0 bg-[#2a343d] shadow-sm rounded-md">
      <CardHeader className="text-white text-center pb-4 pt-6 px-4">
        <CardTitle className="text-2xl text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {step === "credentials" ? "Login" : "Enter One-Time Password"}
        </CardTitle>
        <div className="mt-2 mx-auto w-40 h-1 bg-[#55c0c0]"></div>
        <CardDescription className="mt-4 text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
          {step === "credentials"
            ? "Enter your email or mobile number to receive a one-time password"
            : "We've sent a 6-digit code to your email or mobile"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === "credentials" ? (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john.smith@example.com"
                          {...field}
                          className="bg-white border-0 rounded-md"
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
                      <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Mobile
                      </FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="inline-flex items-center border-0 border-r-0 border-input bg-gray-200 px-3 text-sm text-slate-500 rounded-l-md">
                            +44
                          </span>
                          <Input
                            className="rounded-l-none rounded-r-md bg-white border-0"
                            placeholder="7123456789"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      One-Time Password
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="123456" maxLength={6} {...field} className="bg-white border-0 rounded-md" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-12"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {step === "credentials" ? "Sending OTP..." : "Verifying..."}
                </>
              ) : step === "credentials" ? (
                "Send One-Time Password"
              ) : (
                "Verify & Login"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      {step === "otp" && (
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setStep("credentials")}
            className="text-[#55c0c0] hover:text-[#47a3a3]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Back to login
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

