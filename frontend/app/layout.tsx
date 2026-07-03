import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import WakeupNotification from "@/components/WakeupNotification";
import { DialogProvider } from "@/components/ui/dialog/DialogProvider";
import { RateLimitProvider } from "@/components/providers/RateLimitProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "AI Interview Coach",
  description:
    "Resume-aware AI interview preparation platform with ATS analysis, mock interviews, and Resume Chat.",
  openGraph: {
    title: "AI Interview Coach",
    description:
      "Practice smarter with AI-powered mock interviews, ATS resume analysis, and Resume Chat.",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "AI Interview Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Interview Coach",
    description: "Resume-aware AI interview preparation platform.",
    images: ["/thumbnail.png"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white h-[100dvh] flex flex-col overflow-hidden`}>
        <WakeupNotification />
        <div className="flex-1 overflow-y-auto relative flex flex-col">
          <AuthProvider>
            <DialogProvider>
              <RateLimitProvider>
                {children}
              </RateLimitProvider>
            </DialogProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
