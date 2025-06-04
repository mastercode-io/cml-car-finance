"use client"

import { useState, Suspense } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { LogoHeader } from "@/components/logo-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
  mobile: z.string().min(10, { message: "Please enter a valid mobile number" }).optional(),
  loginMethod: z.enum(["mobile", "email"]),
}).refine(
  (data) => {
    // If loginMethod is email, email must be provided
    // If loginMethod is mobile, mobile must be provided
    if (data.loginMethod === "email") {
      return !!data.email;
    }
    if (data.loginMethod === "mobile") {
      return !!data.mobile;
    }
    return false;
  },
  {
    message: "Please provide the required contact information",
    path: ["email"],
  }
);

function AdminLoginContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<"mobile" | "email">("mobile")
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      mobile: "",
      loginMethod: "mobile",
    },
  })

  const { clearErrors } = form

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const values = form.getValues();
      onSubmit(values);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setGeneralError(null)
    
    try {
      // Here you would implement the admin login logic
      console.log('Admin login submitted with values:', values)
      
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For now, just show an error message
      setGeneralError("Admin login functionality is not yet implemented.")
    } catch (error) {
      console.error('Error during admin login:', error)
      setGeneralError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-0 bg-[#2a343d] shadow-sm rounded-md">
        <CardHeader className="text-white text-center pb-4 pt-6 px-4">
          <CardTitle className="text-2xl text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Admin Login
          </CardTitle>
          <div className="mt-2 mx-auto w-40 h-1 bg-[#55c0c0]"></div>
          <CardDescription className="mt-4 text-gray-300" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
            Enter your admin credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter your username"
                              {...field}
                              onKeyPress={handleKeyPress}
                              className="bg-white border-0 rounded-md"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                              onKeyPress={handleKeyPress}
                              className="bg-white border-0 rounded-md"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Login Method
                      </FormLabel>
                      <div className="flex justify-center space-x-6 mb-4 mt-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="mobile-option"
                            name="login-method"
                            value="mobile"
                            checked={loginMethod === "mobile"}
                            onChange={() => {
                              setLoginMethod("mobile");
                              form.setValue("loginMethod", "mobile");
                              clearErrors();
                            }}
                            className="mr-2 h-4 w-4 accent-[#55c0c0]"
                          />
                          <label htmlFor="mobile-option" className="text-white cursor-pointer">
                            Mobile
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="email-option"
                            name="login-method"
                            value="email"
                            checked={loginMethod === "email"}
                            onChange={() => {
                              setLoginMethod("email");
                              form.setValue("loginMethod", "email");
                              clearErrors();
                            }}
                            className="mr-2 h-4 w-4 accent-[#55c0c0]"
                          />
                          <label htmlFor="email-option" className="text-white cursor-pointer">
                            Email
                          </label>
                        </div>
                      </div>

                      {loginMethod === "email" && (
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
                                  onKeyPress={handleKeyPress}
                                  className="bg-white border-0 rounded-md"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      )}

                      {loginMethod === "mobile" && (
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
                                    onKeyPress={handleKeyPress}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-12"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Logging in...
                        </>
                      ) : (
                        "Log In"
                      )}
                    </Button>
                  </form>
                </Form>
                {generalError && (
                  <div className="mt-4">
                    <p className="text-red-400 text-sm">{generalError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
  )
}

// Main page component with suspense boundary
export default function AdminLoginPage() {
  return (
    <main className="bg-white min-h-screen flex flex-col">
      <LogoHeader />
      <div className="flex-1 flex items-center justify-center py-8 mb-[10vh]">
        <div className="w-full px-4 md:px-6">
          <Suspense fallback={<div className="mx-auto max-w-md">Loading...</div>}>
            <AdminLoginContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
