"use client"

import { Loader2 } from "lucide-react"

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export function LoadingModal({ isOpen, message = "Processing your request..." }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4 max-w-sm w-full mx-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#55c0c0]" />
        <p className="text-center text-gray-700" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
          {message}
        </p>
      </div>
    </div>
  );
} 