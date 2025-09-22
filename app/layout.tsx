'use client'
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import React from "react";

// const inter = Inter({ subsets: ["latin"] });
const plusJakartaSans =   Plus_Jakarta_Sans({ subsets: ["latin"] });


// export const metadata: Metadata = {
//   title: "Antrian Online",
//   description: "Ini merupakan Project Pertama",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  React.useEffect(() => {
    return () => {
      require("bootstrap/dist/js/bootstrap.bundle.min.js");
    };
  }, []); // Provide the dependencies array if needed

  return (
    <html lang="en">
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
