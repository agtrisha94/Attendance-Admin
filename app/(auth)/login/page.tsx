"use client";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordType = showPassword ? "text" : "password";

  // Hardcoded credentials for demo purposes
  const DEMO_CREDENTIALS = {
    email: "demo@example.com",
    password: "password123",
  };

  const handleLogin = () => {
    setError("");

    const isValid =
      email === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password;

    if (isValid) {
      if (typeof window !== "undefined") {
        localStorage.setItem("isAuthenticated", "true");
      }
      router.push("/admin");
    } else {
      setError(
        "Invalid credentials. Use email: demo@example.com with password: password123"
      );
    }
  };

  const handleFirstTimeUser = () => {
    router.push("/reset");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-100">
            Login to Your Account
          </h1>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-500" size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  placeholder="demo@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordType}
                  value={password}
                  placeholder="password123"
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded-md transition duration-200 dark:bg-green-800 dark:hover:bg-green-900"
            >
              Log In
            </button>

            {/* First-time User Link */}
            <div className="text-center">
              <button
                onClick={handleFirstTimeUser}
                className="text-sm text-green-700 hover:text-green-800 hover:underline dark:text-green-400 dark:hover:text-green-200"
              >
                Are you a first-time user?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
