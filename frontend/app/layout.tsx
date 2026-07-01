import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import WakeupNotification from "@/components/WakeupNotification";
import { DialogProvider } from "@/components/ui/dialog/DialogProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Interview Coach",
  description: "Mock technical interviews powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <WakeupNotification />
        <AuthProvider>
          <DialogProvider>
            {children}
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
