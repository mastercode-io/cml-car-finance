"use client"

import type React from "react"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, parse } from "date-fns"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { startUserSession } from "@/utils/session"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { LoadingModal } from "@/components/ui/loading-modal"

const formSchema = z.object({
  title: z.string().optional(),
  firstName: z.string().min(1, "First name is required").trim(),
  surname: z.string().min(1, "Last name is required").trim(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  email: z.string().email("Invalid email address").min(1, "Email is required").trim(),
  mobile: z.string().min(1, "Mobile number is required")
    .regex(/^[0-9]+$/, "Mobile number must contain only numbers")
    .min(10, "Mobile number must be at least 10 digits")
    .max(11, "Mobile number must not exceed 11 digits"),
  postcode: z.string().min(1, "Postcode is required")
    .transform(val => val.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/, "Invalid postcode format")),
  addressLine: z.string().min(1, "Address is required").trim(),
  houseNumber: z.string().optional(),
  houseName: z.string().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
})

interface AddressResponse {
  addressList: Array<{
    postcode: string;
    postTown: string;
    buildingNumber: string;
    buildingName: string;
    subBuildingName: string;
    line1: string;
    line2: string;
    line3: string;
    country: string;
    county: string;
    thoroughfare: string;
    district: string;
    locality: string;
  }>;
}

interface FormattedAddress {
  displayText: string;
  houseNumber: string;
  houseName: string;
}

const lookupAddresses = async (postcode: string): Promise<FormattedAddress[]> => {
  try {
    console.log('Looking up addresses for postcode:', postcode);
    const response = await fetch('/.netlify/functions/postcode-address-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postcode }),
    });

    if (!response.ok) {
      throw new Error('Failed to lookup addresses');
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.result?.addressList) {
      console.log('No addresses found in response');
      return [];
    }

    // The addressList already has the correct format with displayText, houseNumber, and houseName
    return data.result.addressList;
  } catch (error) {
    console.error('Error looking up addresses:', error);
    return [];
  }
};

export function CreditSearchForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateInputValue, setDateInputValue] = useState<string>("");
  const [addressList, setAddressList] = useState<FormattedAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<FormattedAddress | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      firstName: "",
      surname: "",
      dateOfBirth: undefined,
      email: "",
      mobile: "",
      postcode: "",
      addressLine: "",
      houseNumber: "",
      houseName: "",
      termsAccepted: false,
    },
  });

  const handlePostcodeBlur = async (postcode: string) => {
    if (!postcode) return;
    
    setIsLoadingAddresses(true);
    try {
      const addresses = await lookupAddresses(postcode);
      console.log('Formatted addresses:', addresses);
      setAddressList(addresses);
    } catch (error) {
      console.error('Error in handlePostcodeBlur:', error);
      setAddressList([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddressSelect = (address: FormattedAddress) => {
    console.log('Selected address:', address);
    setSelectedAddress(address);
    
    // Set the form values
    form.setValue("addressLine", address.displayText);
    form.setValue("houseNumber", address.houseNumber || '');
    form.setValue("houseName", address.houseName || '');
    
    // Log the current form values to verify
    console.log('Form values after selection:', form.getValues());
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value;
    setDateInputValue(value);

    if (value === "") {
      field.onChange(undefined);
      return;
    }

    // Try to parse the date if it matches the format
    if (value.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      try {
        const date = parse(value, "dd.MM.yyyy", new Date());
        if (!isNaN(date.getTime()) && date <= new Date() && date >= new Date("1900-01-01")) {
          field.onChange(date);
        }
      } catch (error) {
        // Invalid date
      }
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Check if all required fields are filled
    const requiredFields = ['firstName', 'surname', 'dateOfBirth', 'email', 'mobile', 'postcode', 'addressLine', 'termsAccepted'] as const;
    const missingFields = requiredFields.filter(field => !values[field]);
    
    if (missingFields.length > 0) {
      missingFields.forEach(field => {
        form.setError(field, {
          type: 'required',
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        });
      });
      return;
    }

    setIsSubmitting(true);
    
    // Format the date to YYYY-MM-DD
    const formattedDate = format(values.dateOfBirth, "yyyy-MM-dd");
    
    // Prepare the request body
    const requestBody = {
      title: values.title,
      firstName: values.firstName,
      surname: values.surname,
      dateOfBirth: formattedDate,
      email: values.email,
      mobile: values.mobile,
      postalCode: values.postcode,
      houseNumber: values.houseNumber || '',
      houseName: values.houseName || '',
      addressLine: values.addressLine,
    };

    // Make the API request
    console.log('Credit search - Starting API request with body:', JSON.stringify(requestBody));
    
    fetch('/.netlify/functions/credit-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .then(response => {
        console.log('Credit search - API response received:', { 
          status: response.status, 
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          console.error('Credit search - Response not OK:', response.status, response.statusText);
          return response.json().then(errorData => {
            console.error('Credit search - Error data:', errorData);
            throw new Error(errorData.error || 'Failed to process credit search request');
          });
        }
        console.log('Credit search - Response OK, parsing JSON');
        return response.json();
      })
      .then(data => {
        // Check if the response indicates an existing contact
        console.log('Credit search response:', data);
        console.log('Existing contact check:', data.result?.existingContact);
        
        if (data.result?.existingContact === true) {
          // Store contactID and leadID for the login page
          const contactID = data.result?.contactID || '';
          const leadID = data.result?.leadID || '';
          
          console.log('Existing contact detected, storing IDs:', { contactID, leadID });
          
          // Store these IDs in localStorage for the login page to access
          localStorage.setItem('contactID', contactID);
          localStorage.setItem('leadID', leadID);
          
          // Redirect to login page with a parameter indicating it's a redirect from search
          router.push('/?from=search');
        } else {
          // Store the response in localStorage (only for non-existing contacts)
          localStorage.setItem('creditSearchResponse', JSON.stringify(data));
          
          // Start a user session with the leadID and contactID from the response
          const leadID = data.result?.leadID || '';
          const contactID = data.result?.contactID || '';
          
          if (leadID || contactID) {
            // Use a generic module name for credit search users
            startUserSession(leadID || contactID, 'credit_search');
            console.log('Started user session from credit search:', { leadID, contactID });
          }
          
          // Normal flow - redirect to loans page
          router.push('/loans');
        }
      })
      .catch(error => {
        console.error('Credit search - Error in submission process:', { 
          message: error.message,
          name: error.name,
          stack: error.stack,
          toString: error.toString()
        });
        
        // Log the environment
        console.log('Credit search - Environment info:', { 
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'unknown'
        });
        
        alert('An error occurred while processing your request. Please try again later.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  function handleClear() {
    form.reset()
    setAddressList([])
  }

  return (
    <>
      <LoadingModal 
        isOpen={isSubmitting} 
        message="Processing your credit search request... Please wait." 
      />
      <Card className="border-0 bg-[#2a343d] shadow-sm rounded-md mb-8">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                {/* Title - Order 1 on mobile */}
                <div className="order-1 md:order-none">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Title
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-0 rounded-md" tabIndex={1}>
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-md">
                            <SelectItem value="mr">Mr</SelectItem>
                            <SelectItem value="mrs">Mrs</SelectItem>
                            <SelectItem value="miss">Miss</SelectItem>
                            <SelectItem value="ms">Ms</SelectItem>
                            <SelectItem value="dr">Dr</SelectItem>
                            <SelectItem value="rev">Rev</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date of Birth - Order 5 on mobile */}
                <div className="order-5 md:order-none">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Date of Birth <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="DD.MM.YYYY"
                                  value={dateInputValue}
                                  onChange={(e) => handleDateInput(e, field)}
                                  className="bg-white border-0 rounded-md pr-10"
                                  tabIndex={5}
                                />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                              </div>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-md" align="start">
                            <div className="p-3">
                              <div className="flex justify-center items-center mb-4">
                                <div className="flex items-center gap-2">
                                  <select 
                                    className="bg-transparent border rounded-md px-2 py-1 text-sm"
                                    value={field.value?.getMonth()}
                                    onChange={(e) => {
                                      const newDate = new Date(field.value || new Date());
                                      newDate.setMonth(parseInt(e.target.value));
                                      field.onChange(newDate);
                                      setDateInputValue(format(newDate, "dd.MM.yyyy"));
                                    }}
                                  >
                                    <option value="0">January</option>
                                    <option value="1">February</option>
                                    <option value="2">March</option>
                                    <option value="3">April</option>
                                    <option value="4">May</option>
                                    <option value="5">June</option>
                                    <option value="6">July</option>
                                    <option value="7">August</option>
                                    <option value="8">September</option>
                                    <option value="9">October</option>
                                    <option value="10">November</option>
                                    <option value="11">December</option>
                                  </select>
                                  <select 
                                    className="bg-transparent border rounded-md px-2 py-1 text-sm"
                                    value={field.value?.getFullYear()}
                                    onChange={(e) => {
                                      const newDate = new Date(field.value || new Date());
                                      newDate.setFullYear(parseInt(e.target.value));
                                      field.onChange(newDate);
                                      setDateInputValue(format(newDate, "dd.MM.yyyy"));
                                    }}
                                  >
                                    {Array.from({ length: 84 }, (_, i) => 2003 - i).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                <div className="font-medium">Su</div>
                                <div className="font-medium">Mo</div>
                                <div className="font-medium">Tu</div>
                                <div className="font-medium">We</div>
                                <div className="font-medium">Th</div>
                                <div className="font-medium">Fr</div>
                                <div className="font-medium">Sa</div>
                                
                                {Array.from({ length: 42 }, (_, i) => {
                                  const date = new Date(field.value?.getFullYear() || 2003, field.value?.getMonth() || 0, 1);
                                  const firstDay = date.getDay();
                                  const daysInMonth = new Date(field.value?.getFullYear() || 2003, field.value?.getMonth() || 0 + 1, 0).getDate();
                                  
                                  if (i < firstDay) {
                                    return <div key={`empty-${i}`} className="h-9 w-9"></div>;
                                  }
                                  
                                  const day = i - firstDay + 1;
                                  if (day > daysInMonth) {
                                    return <div key={`empty-${i}`} className="h-9 w-9"></div>;
                                  }
                                  
                                  const currentDate = new Date(field.value?.getFullYear() || 2003, field.value?.getMonth() || 0, day);
                                  const isSelected = field.value && 
                                    currentDate.getDate() === field.value.getDate() && 
                                    currentDate.getMonth() === field.value.getMonth() && 
                                    currentDate.getFullYear() === field.value.getFullYear();
                                  const isToday = 
                                    currentDate.getDate() === new Date().getDate() && 
                                    currentDate.getMonth() === new Date().getMonth() && 
                                    currentDate.getFullYear() === new Date().getFullYear();
                                  const isDisabled = currentDate > new Date() || currentDate < new Date("1900-01-01");
                                  
                                  return (
                                    <button
                                      key={`day-${day}`}
                                      className={`h-9 w-9 rounded-md ${
                                        isSelected 
                                          ? "bg-primary text-primary-foreground" 
                                          : isToday 
                                            ? "bg-accent text-accent-foreground" 
                                            : "hover:bg-accent hover:text-accent-foreground"
                                      } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                      disabled={isDisabled}
                                      onClick={() => {
                                        field.onChange(currentDate);
                                        setDateInputValue(format(currentDate, "dd.MM.yyyy"));
                                      }}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* First Name - Order 2 on mobile */}
                <div className="order-2 md:order-none">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          First Name <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white border-0 rounded-md" tabIndex={2} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mobile - Order 6 on mobile */}
                <div className="order-6 md:order-none">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Mobile <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center border-0 border-r-0 border-input bg-gray-200 px-3 text-sm text-slate-500 rounded-l-md">
                              +44
                            </span>
                            <Input className="rounded-l-none rounded-r-md bg-white border-0" {...field} tabIndex={6} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Middle Name - Order 3 on mobile */}
                <div className="order-3 md:order-none">
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Middle Name <span className="text-transparent ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} className="bg-white border-0 rounded-md" tabIndex={3} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email - Order 7 on mobile */}
                <div className="order-7 md:order-none">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Email <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" {...field} className="bg-white border-0 rounded-md" tabIndex={7} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Surname - Order 4 on mobile */}
                <div className="order-4 md:order-none">
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Surname <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white border-0 rounded-md" tabIndex={4} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Postal Code - Order 8 on mobile */}
                <div className="order-8 md:order-none">
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Postal Code <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onBlur={(e) => {
                              const upperPostcode = e.target.value.toUpperCase();
                              field.onChange(upperPostcode);
                              field.onBlur();
                              handlePostcodeBlur(upperPostcode);
                            }}
                            className="bg-white border-0 rounded-md"
                            tabIndex={8}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Line - Full Width - Order 9 on mobile */}
              <div className="order-9 md:order-none">
                <FormField
                  control={form.control}
                  name="addressLine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Address Line <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selectedAddr = addressList.find(addr => addr.displayText === value);
                          if (selectedAddr) {
                            handleAddressSelect(selectedAddr);
                          }
                        }} 
                        value={field.value}
                        disabled={isLoadingAddresses}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-0 rounded-md" tabIndex={9}>
                            <SelectValue placeholder={isLoadingAddresses ? "Loading addresses..." : "Select your address"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md">
                          {addressList.length === 0 ? (
                            <SelectItem value="error" disabled>
                              {isLoadingAddresses 
                                ? "Loading addresses..." 
                                : form.getValues("postcode") 
                                  ? "Not a valid postal code" 
                                  : "Enter post code first"}
                            </SelectItem>
                          ) : (
                            addressList.map((address, index) => (
                              <SelectItem key={index} value={address.displayText}>
                                {address.displayText}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Terms Acceptance */}
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-white data-[state=checked]:bg-[#55c0c0] data-[state=checked]:border-[#55c0c0] rounded-[0.25rem]"
                        tabIndex={10}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel
                        className="text-sm font-normal text-gray-300"
                        style={{ fontFamily: '"Source Sans Pro", sans-serif' }}
                      >
                        I confirm that I have had a finance in the past 6 years and that I was not aware of a commission
                        payment being made to the dealer. I have read and accept T&Cs and the privacy policy. I understand
                        that in order for us to investigate any further, we will conduct a soft credit check through our
                        provider ValidID and that this will not affect my credit score.
                      </FormLabel>
                      <FormMessage className="text-red-400" />
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex w-full space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1 bg-[#55c0c0] text-white hover:bg-[#47a3a3] hover:text-white border-0 rounded-md h-12"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  tabIndex={11}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#c73e48] text-white hover:bg-[#b03540] border-0 rounded-md h-12"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  tabIndex={12}
                >
                  Search
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}

