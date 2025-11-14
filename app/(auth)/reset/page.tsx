// app/(auth)/reset/page.tsx
"use client";
import { Suspense } from "react";
import ResetPasswordClient from "../../reset-password/ResetPasswordClient";

export const dynamic = "force-dynamic"; // optional if you need dynamic behavior

export default function ResetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
