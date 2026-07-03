import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import WakeupNotification from "@/components/WakeupNotification";
import { DialogProvider } from "@/components/ui/dialog/DialogProvider";
import { RateLimitProvider } from "@/components/providers/RateLimitProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://skillmock.vercel.app"),
  title: {
    default: "SkillMock — Resume-Aware AI Interview Coach",
    template: "%s | SkillMock"
  },
  description:
    "AI-powered interview preparation tailored to your resume and career goals. Get personalized ATS analysis, realistic mock interviews, and actionable AI feedback.",
  keywords: ["AI interview", "mock interview", "resume analysis", "ATS checker", "interview prep", "job preparation", "RAG", "AI coach", "SkillMock"],
  authors: [{ name: "SkillMock Team" }],
  creator: "SkillMock",
  publisher: "SkillMock",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://skillmock.vercel.app"
  },
  openGraph: {
    title: "SkillMock — AI Interview Coach",
    description:
      "AI-powered interview preparation tailored to your resume. ATS analysis, mock interviews, and Resume Chat.",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "SkillMock — AI Interview Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillMock — AI Interview Coach",
    description: "AI-powered interview preparation tailored to your resume and career goals.",
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
