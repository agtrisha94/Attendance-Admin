// src/app/(auth)/forgot/page.tsx
"use client";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://attendance-app-o83z.onrender.com";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      // Try common endpoint /auth/forgot (adjust if your backend differs)
      const res = await fetch(`${API_BASE}/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Unable to send reset instructions.");
        setLoading(false);
        return;
      }

      // If backend returns a token (some do in dev), pass it to reset page
      const token = data?.token;
      setIsSubmitted(true);

      // navigate to /reset — if token present, include it in query so reset page can use it.
      setTimeout(() => {
        if (token) router.push(`/reset?token=${encodeURIComponent(token)}`);
        else router.push("/reset");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-100">
            {isSubmitted ? "Check Your Inbox" : "Reset Your Password"}
          </h1>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          {!isSubmitted ? (
            <div className="space-y-6">
              <p className="text-gray-600 text-center dark:text-gray-300">
                Enter your registered email to receive reset instructions
              </p>

              {/* Email Input Field */}
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-gray-500" size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    placeholder="your.email@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!email.includes("@") || loading}
                className={`w-full bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ${
                  !email.includes("@")
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-800"
                } dark:bg-green-800 dark:hover:bg-green-900 disabled:opacity-60`}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md dark:bg-green-900 dark:border-green-800 dark:text-green-100">
                <p>We've sent reset instructions to your email</p>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Didn't receive anything?{" "}
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setError("");
                  }}
                  className="text-green-700 hover:underline dark:text-green-400 dark:hover:text-green-200"
                >
                  Resend
                </button>
              </p>
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-green-700 hover:text-green-800 hover:underline dark:text-green-400 dark:hover:text-green-200"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
