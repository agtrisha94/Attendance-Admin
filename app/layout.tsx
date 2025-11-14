import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import InterceptorProvider from "./interceptor-provider"; // <- new import

export const metadata: Metadata = {
  title: "Attendance App",
  description: "College Attendance Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {/* InterceptorProvider is a client component that ensures the axios interceptor is attached */}
        <InterceptorProvider>
          <ThemeProvider>
            <div className="h-full">{children}</div>
          </ThemeProvider>
        </InterceptorProvider>
      </body>
    </html>
  );
}
