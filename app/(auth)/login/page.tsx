"use client";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://attendance-app-o83z.onrender.com";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordType = showPassword ? "text" : "password";

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || "Login failed. Check credentials.";
        setError(msg);
        setLoading(false);
        return;
      }

      // Expecting access_token, refresh_token (optional), role, userId, teacherId, studentId
      const {
        access_token,
        refresh_token,
        role,
        userId,
        teacherId,
        studentId,
      } = data as any;

      if (!access_token) {
        setError("Login succeeded but server did not return access token.");
        setLoading(false);
        return;
      }

      // Persist for client usage
      localStorage.setItem("token", access_token);
      if (refresh_token) localStorage.setItem("refreshToken", refresh_token);
      if (role) localStorage.setItem("role", role);
      if (userId) localStorage.setItem("userId", userId);
      if (teacherId) localStorage.setItem("teacherId", teacherId);
      if (studentId) localStorage.setItem("studentId", studentId);
      localStorage.setItem("isAuthenticated", "true");

      // navigate based on role (optional)
      if (role === "ADMIN") router.push("/admin");
      else if (role === "TEACHER") router.push("/teacher");
      else if (role === "STUDENT") router.push("/student");
      else router.push("/admin"); // fallback

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFirstTimeUser = () => {
    router.push("/(auth)/reset");
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
                  placeholder="your.email@example.com"
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
                  placeholder="password"
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
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded-md transition duration-200 dark:bg-green-800 dark:hover:bg-green-900 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log In"}
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

            <div className="text-center">
              <button
                onClick={() => router.push("/(auth)/forgot")}
                className="text-sm text-gray-600 hover:underline dark:text-gray-300"
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
