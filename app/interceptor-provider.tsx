"use client";

import { useEffect } from "react";
import { attachInterceptor } from "@/lib/api";

export default function InterceptorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    attachInterceptor();
  }, []);

  return <>{children}</>;
}
