import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "David Training — Elite Coaching Platform",
  description: "Premium fitness coaching, workout videos, nutrition plans and 1:1 support with Coach David. Join the elite.",
  keywords: ["personal trainer", "fitness", "Houston", "online coaching", "workout plans"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col ambient">{children}</body>
    </html>
  );
}
