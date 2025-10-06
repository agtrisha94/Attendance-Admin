"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMessage("Invalid or missing token.");
    }
  }, [token]);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setErrorMessage("Please fill both fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to reset password.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <h2 style={{ color: "green" }}>Password reset successfully!</h2>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h2>Reset Password</h2>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />
      <button
        onClick={handleReset}
        disabled={loading}
        style={{ padding: "8px 16px" }}
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
      {errorMessage && (
        <p style={{ color: "red", marginTop: "12px" }}>{errorMessage}</p>
      )}
    </div>
  );
}
