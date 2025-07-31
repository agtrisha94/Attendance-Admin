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
    password: "password123"
  };

  const handleLogin = () => {
    setError("");
    
    // Validate credentials
    let isValid = false;
    
    isValid = email === DEMO_CREDENTIALS.email && 
              password === DEMO_CREDENTIALS.password;

    if (isValid) {
      // Store simple auth state in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAuthenticated', 'true');
      }
      console.log("Simulating navigation to /admin");
      router.push('/admin'); 
    } else {
      setError("Invalid credentials. Use email: demo@example.com with password: password123");
    }
  };

  const handleForgotPassword = () => {
    console.log("Simulating navigation to /forgot");
    router.push('/forgot'); 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Login Form Container */}
      <div className="flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login to Your Account</h1>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-500" size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  placeholder="demo@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={passwordType}
                  value={password}
                  placeholder="password123"
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-md w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Log In
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                onClick={handleForgotPassword}
                className="text-sm text-green-700 hover:text-green-800 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}