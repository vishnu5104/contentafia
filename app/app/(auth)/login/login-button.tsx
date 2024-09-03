"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  useEffect(() => {
    const errorMessage = Array.isArray(error) ? error.pop() : error;
    errorMessage && toast.error(errorMessage);
  }, [error]);

  const handleLogin = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        setLoading(true);
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // Get the selected address
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          // Sign in with the first account
          await signIn("credentials", {
            address: accounts[0],
            callbackUrl: "/",
          });
          console.log("works");
        } else {
          toast.error(
            "No accounts found. Please connect your MetaMask wallet.",
          );
        }
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        toast.error("Failed to connect to MetaMask. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("MetaMask not detected. Please install MetaMask extension.");
    }
  };

  return (
    <Button onClick={handleLogin} disabled={loading} className="w-full">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          ></path>
        </svg>
      )}
      {loading ? "Connecting..." : "Login with MetaMask"}
    </Button>
  );
}
