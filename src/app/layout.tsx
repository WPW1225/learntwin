import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LearnTwin AI — Your Learning Doctor",
  description: "Snap a photo of your homework. LearnTwin reads it, diagnoses the root causes of your mistakes, and trains them away — with a memory that spans assignments.",
  keywords: ["LearnTwin", "AI tutor", "math diagnosis", "learning twin", "homework help"],
  icons: {
    icon: "https://new-front.chatglm.cn/activeimg/effective-web/69f17993283edbb6900dce9a",
  },
  openGraph: {
    title: "LearnTwin AI",
    description: "Errors are patterns. We diagnose the pattern, not the problem.",
    url: "https://agentmore.chatglm.cn/",
    siteName: "AgentMore",
    type: "website",
    images: [
      {
        url: "https://new-front.chatglm.cn/activeimg/effective-web/69f17993283edbb6900dce9a",
        alt: "AgentMore Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentMore",
    description: "AI-powered development with modern React stack",
    images: ["https://new-front.chatglm.cn/activeimg/effective-web/69f17993283edbb6900dce9a"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
