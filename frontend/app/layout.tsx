import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { AnalyzeProvider } from "@/context/AnalyzeProvoder";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MLP - Marathi Language Processing",
  description:
    "Analyze Marathi social media content with our advanced sentiment analysis platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " bg-white"}>
        <AnalyzeProvider>
          <div className="min-h-screen flex flex-col bg-white w-full max-w-md mx-auto">
            <Navbar />
            <main className="flex-1 pt-[72px]">{children}</main>
            <Footer />
          </div>
        </AnalyzeProvider>
      </body>
    </html>
  );
}
