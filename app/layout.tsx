import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";


export const metadata = {
  title: 'Attendance App',
  description: 'College Attendance Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <ThemeProvider> {/* This is the key */}
          <div className="h-full">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

