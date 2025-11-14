// app/reset-password/ResetPasswordClient.tsx
"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://attendance-app-o83z.onrender.com";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams?.get("token") || "";

  const [step, setStep] = useState<"email" | "password">(
    tokenFromQuery ? "password" : "email"
  );

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const newPasswordType = showNewPassword ? "text" : "password";
  const confirmPasswordType = showConfirmPassword ? "text" : "password";

  const handleProceed = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Unable to request password reset.");
        setLoading(false);
        return;
      }

      setInfo(
        "We sent instructions to your email. Check inbox and follow the link or paste the token below."
      );
      setStep("password");

      if (data?.token) {
        router.push(`/reset?token=${encodeURIComponent(data.token)}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const token = tokenFromQuery || otp;
      if (!token) {
        setError(
          "No reset token found. Please check your email for the reset link or token."
        );
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: newPassword,
          email: email || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Unable to reset password.");
        setLoading(false);
        return;
      }

      // success
      router.push("/login");
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
            {step === "email" ? "Verify Your Email" : "Set New Password"}
          </h1>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 p-2 bg-green-50 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-100">
              {info}
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700 dark:text-gray-300">
                  Registered Email Address
                </label>
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
                onClick={handleProceed}
                disabled={!email.includes("@") || loading}
                className={`w-full bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ${
                  !email.includes("@")
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-800"
                } dark:bg-green-800 dark:hover:bg-green-900 disabled:opacity-60`}
              >
                {loading ? "Sending..." : "Proceed"}
              </button>
            </div>
          )}

          {/* Step 2: Set Password */}
          {step === "password" && (
            <div className="space-y-6">
              {!tokenFromQuery && (
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">
                    Reset Token / OTP (from email)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    placeholder="Enter token from email"
                    onChange={(e) => setOtp(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={newPasswordType}
                    value={newPassword}
                    placeholder="Enter new password"
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={confirmPasswordType}
                    value={confirmPassword}
                    placeholder="Confirm new password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={
                  newPassword !== confirmPassword || newPassword.length < 8 || loading
                }
                className={`w-full bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ${
                  newPassword !== confirmPassword || newPassword.length < 8
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-800"
                } dark:bg-green-800 dark:hover:bg-green-900 disabled:opacity-60`}
              >
                {loading ? "Saving..." : "Set New Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
