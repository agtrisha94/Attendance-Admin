"use client";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "password">("email");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPasswordType = showNewPassword ? "text" : "password";
  const confirmPasswordType = showConfirmPassword ? "text" : "password";

  const handleProceed = () => {
    console.log("Email verified:", email);
    setStep("password");
  };

  const handleResetPassword = () => {
    console.log("Password reset successful for:", email);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-100">
            {step === "email" ? "Verify Your Email" : "Set New Password"}
          </h1>

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
                disabled={!email.includes("@")}
                className={`w-full bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ${
                  !email.includes("@")
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-800"
                } dark:bg-green-800 dark:hover:bg-green-900`}
              >
                Proceed
              </button>
            </div>
          )}

          {/* Step 2: Set Password */}
          {step === "password" && (
            <div className="space-y-6">
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
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={
                  newPassword !== confirmPassword || newPassword.length < 8
                }
                className={`w-full bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ${
                  newPassword !== confirmPassword || newPassword.length < 8
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-800"
                } dark:bg-green-800 dark:hover:bg-green-900`}
              >
                Set New Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
