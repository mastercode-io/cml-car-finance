"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { startUserSession } from "@/utils/session"

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
  const [loginMethod, setLoginMethod] = useState<"mobile" | "email">("mobile")
  const [otpError, setOtpError] = useState<{ status: string } | null>(null)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [showPortalAccessButton, setShowPortalAccessButton] = useState(false)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const values = form.getValues();
      onSubmit(values);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      mobile: "",
      otp: "",
    },
  })

  const clearErrors = () => {
    setOtpError(null);
    setGeneralError(null);
    setShowPortalAccessButton(false);
    form.clearErrors();
  };

  // Function to handle specific API error responses
  const handleApiError = async (response: Response, data: any, identifier: string) => {
    const statusCode = response.status;
    
    switch (statusCode) {
      case 400:
      case 500:
        setGeneralError("Something went wrong. Please try again in a few moments.");
        break;
        
      case 404:
        // Show portal access invitation for 404 errors
        setGeneralError("We couldn't find an existing portal account with these details.");
        setShowPortalAccessButton(true);
        break;
        
      default:
        setGeneralError("Something went wrong. Please try again in a few moments.");
        break;
    }
  };
  
  // Function to resend OTP
  async function resendOtp() {
    setResendingOtp(true);
    try {
      const values = form.getValues();
      const identifier = loginMethod === "email" ? values.email : values.mobile;
      
      if (!identifier) {
        setStep("credentials");
        return;
      }
      
      // Call the Netlify function to send OTP
      const response = await fetch('/.netlify/functions/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: loginMethod === "email" ? identifier : undefined,
          mobile: loginMethod === "mobile" ? identifier : undefined
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // OTP resent successfully
        setOtpError(null);
        form.clearErrors("otp");
      } else {
        // Handle API error
        setOtpError({
          status: "error"
        });
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setOtpError({
        status: "error"
      });
    } finally {
      setResendingOtp(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form submitted with values:', values);
    console.log('Current step:', step);
    console.log('Login method:', loginMethod);
    
    // Clear any previous errors
    clearErrors();
    
    if (step === "credentials") {
      setIsLoading(true)
      console.log('Credentials step - setting isLoading to true');
      
      try {
        // Only proceed with the selected login method
        if (loginMethod === "email" && values.email) {
          // Call the Netlify function to send OTP
          const response = await fetch('/.netlify/functions/send-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: values.email }),
          });
          
          const data = await response.json();
          console.log('OTP API response:', response.status, data);
          
          if (response.ok) {
            // OTP sent successfully, move to OTP verification step
            setStep("otp");
            // Clear any previous errors when entering OTP step
            setOtpError(null);
            form.clearErrors();
          } else {
            // Handle API error
            handleApiError(response, data, values.email);
          }
        } else if (loginMethod === "mobile" && values.mobile) {
          // Call the Netlify function to send OTP to mobile
          const response = await fetch('/.netlify/functions/send-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mobile: values.mobile }),
          });
          
          const data = await response.json();
          console.log('Mobile OTP API response:', response.status, data);
          
          if (response.ok) {
            // OTP sent successfully, move to OTP verification step
            setStep("otp");
            // Clear any previous errors when entering OTP step
            setOtpError(null);
            form.clearErrors();
          } else {
            // Handle API error
            handleApiError(response, data, values.mobile);
          }
        } else {
          // Handle validation error
          const fieldName = loginMethod === "email" ? "email" : "mobile";
          form.setError(fieldName, {
            type: "manual",
            message: `Please enter your ${loginMethod === "email" ? "email address" : "mobile number"}`
          });
        }
      } catch (error) {
        console.error('Error sending OTP:', error);
        setGeneralError("Something went wrong. Please try again in a few moments.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // OTP verification step
      setIsLoading(true);
      
      try {
        console.log('Verifying OTP:', values.otp);
        
        // Get the email or mobile that was used to send the OTP
        const identifier = loginMethod === "email" ? values.email : values.mobile;
        
        // Call the Netlify function to verify OTP
        const response = await fetch('/.netlify/functions/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: loginMethod === "email" ? identifier : undefined,
            mobile: loginMethod === "mobile" ? identifier : undefined,
            otp: values.otp 
          }),
        });
        
        const data = await response.json();
        console.log('OTP verification response:', response.status, data);
        
        if (response.ok && data.status === 'approved') {
          // OTP verified successfully, store user data and redirect to dashboard
          console.log('OTP verified successfully, user approved');
          
          // Start user session with the module and session token
          if (data.module && data.session_token) {
            startUserSession(data.session_token, data.module);
            console.log('Started user session:', { module: data.module, token: data.session_token });
          } else {
            console.error('Missing module or session_token in OTP verification response:', data);
          }
          
          // Redirect to dashboard
          window.location.href = "/dashboard";
        } else {
          // Handle different error statuses
          if (data.status === 'expired') {
            // OTP has expired
            // Don't set form error to avoid duplicate messages
            setOtpError({
              status: "expired"
            });
          } else if (data.status === 'used') {
            // OTP has already been used
            // Don't set form error to avoid duplicate messages
            setOtpError({
              status: "used"
            });
          } else {
            // Generic error or not found
            // Don't set form error to avoid duplicate messages
            setOtpError({
              status: "not_found"
            });
          }
        }
      } catch (error) {
        console.error('Error verifying OTP:', error);
        // Don't set form error to avoid duplicate messages
        setOtpError({
          status: "error"
        });
      } finally {
        setIsLoading(false);
      }
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
          <div className="space-y-6">
            {step === "credentials" ? (
              <>
                <div className="flex justify-center space-x-6 mb-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="mobile-option"
                      name="login-method"
                      value="mobile"
                      checked={loginMethod === "mobile"}
                      onChange={() => {
                        setLoginMethod("mobile");
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
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        One-Time Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          maxLength={6} 
                          onKeyPress={handleKeyPress}
                          {...field} 
                          className="bg-white border-0 rounded-md" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                {otpError && (
                  <div className="mt-2">
                    <p className="text-red-400 text-sm mb-2">
                      {otpError.status === 'expired' && 'Expired verification code.'}
                      {otpError.status === 'used' && 'Expired verification code.'}
                      {(otpError.status === 'not_found' || otpError.status === 'error') && 'Invalid verification code.'}<br />
                      Please try again or request a new code.
                    </p>
                  </div>
                )}
              </>
            )}

            <Button
              type="button"
              className="w-full bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-12"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              disabled={isLoading}
              onClick={() => {
                console.log('Button clicked directly');
                const values = form.getValues();
                console.log('Current form values:', values);
                onSubmit(values);
              }}
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
          </div>
        </Form>
        {generalError && (
          <div className="mt-4">
            <p className="text-red-400 text-sm">{generalError}</p>
            {showPortalAccessButton && (
              <div className="mt-3">
                <p className="text-gray-300 text-sm mb-2">If you're new here, you can request portal access by submitting your details.</p>
                <Button
                  type="button"
                  onClick={() => {
                    // Store the login input in localStorage for the portal access form
                    const identifier = loginMethod === "email" ? form.getValues().email : form.getValues().mobile;
                    if (loginMethod === "email") {
                      localStorage.setItem('portalRequestEmail', identifier || '');
                    } else {
                      localStorage.setItem('portalRequestMobile', identifier || '');
                    }
                    // Navigate to the portal access request page
                    window.location.href = "/portal-access";
                  }}
                  className="w-full bg-[#55c0c0] text-white hover:bg-[#47a3a3] border-0 rounded-md h-10 text-sm"
                >
                  Set up my claims portal
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {step === "otp" && (
        <CardFooter className="flex flex-col space-y-4">
          {otpError && (
            <Button
              type="button"
              variant="secondary"
              className="w-full bg-[#55c0c0] text-white hover:bg-[#47a3a3] border-0 rounded-md h-10 text-sm"
              onClick={resendOtp}
              disabled={resendingOtp}
            >
              {resendingOtp ? (
                <>
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Resending...
                </>
              ) : (
                "Resend Verification Code"
              )}
            </Button>
          )}
          <Button
            variant="link"
            onClick={() => {
              setStep("credentials");
              clearErrors();
            }}
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

