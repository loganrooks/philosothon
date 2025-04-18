import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Philosopher } from "next/font/google";
import NavBar from "@/components/NavBar"; // Assuming components live in src/components
import Footer from "@/components/Footer"; // Assuming components live in src/components
import SupabaseProvider from "@/components/SupabaseProvider";
import ClientWrapper from "@/components/ClientWrapper";
import "./globals.css";

// Configure fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // CSS variable for Inter font
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono", // CSS variable for JetBrains Mono
  weight: ["400", "700"], // Specify weights if needed
});


const philosopher = Philosopher({
  subsets: ["latin"],
  variable: "--font-philosopher", // CSS variable for Philosopher
  weight: ["400", "700"], // Specify weights
});

export const metadata: Metadata = {
  title: "Philosothon Event Platform",
  description: "University of Toronto Philosothon Event Website",
  // Add more metadata later (e.g., icons, open graph tags)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply font variables to the body */}
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${philosopher.variable} font-mono antialiased bg-dark-base text-light-text`} // Use font-mono (JetBrains) by default, apply theme base colors
        // Removed redundant inline style

        suppressHydrationWarning
      >
        <ClientWrapper />

        <SupabaseProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            {/* Simplified horizontal padding, kept vertical padding */}
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16">
              {/* Page content goes here */}
              {children}
            </main>
            <Footer />
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
