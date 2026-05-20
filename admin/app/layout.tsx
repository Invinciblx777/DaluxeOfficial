import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daluxe Admin",
  description: "Daluxe Luxury Skincare Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0B0B0B', color: '#FAFAFA' }}>
        {children}
      </body>
    </html>
  );
}
