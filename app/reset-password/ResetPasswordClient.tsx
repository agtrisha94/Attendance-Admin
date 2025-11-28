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

  const handleRequestReset = async () => {
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to request reset.");
        setLoading(false);
        return;
      }

      setInfo("Password reset link sent to your email!");
      setStep("password");
    } catch (err: any) {
      console.error(err);
      setError("Network error. Try again.");
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

    const resetToken = tokenFromQuery || otp;
    if (!resetToken) {
      setError("Reset token missing.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Unable to reset password.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-6 text-center dark:text-gray-100">
            {step === "email" ? "Reset Your Password" : "Set New Password"}
          </h1>

          {error && (
            <p className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-100">
              {error}
            </p>
          )}

          {info && (
            <p className="mb-4 p-2 bg-green-50 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-100">
              {info}
            </p>
          )}

          {/* Email Step */}
          {step === "email" && (
            <div className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <input
                  type="email"
                  className="w-full bg-gray-50 border border-gray-300 rounded-md py-2 pl-10 pr-3 text-gray-900 focus:ring-2 focus:ring-green-600 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                  placeholder="Enter registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                onClick={handleRequestReset}
                disabled={!email.includes("@") || loading}
                className="w-full bg-green-700 text-white rounded-md px-4 py-2 hover:bg-green-800 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          )}

          {/* Password Step */}
          {step === "password" && (
            <div className="space-y-6">
              {!tokenFromQuery && (
                <input
                  type="text"
                  placeholder="Enter token from email"
                  className="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-2 focus:ring-green-600 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              )}

              {/* New Password */}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 pr-10 focus:ring-2 focus:ring-green-600 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 pr-10 focus:ring-2 focus:ring-green-600 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={
                  newPassword !== confirmPassword ||
                  newPassword.length < 8 ||
                  loading
                }
                className="w-full bg-green-700 text-white rounded-md px-4 py-2 hover:bg-green-800 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Save New Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}