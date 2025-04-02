import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import NavBar from "@/components/NavBar"; // Assuming components live in src/components
import Footer from "@/components/Footer"; // Assuming components live in src/components
import SupabaseProvider from "@/components/SupabaseProvider";
import MatrixBackground from '@/components/MatrixBackground';
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

// TODO: Add configuration for the "Philosopher" heading font if available/required.
// This might involve downloading the font files and setting up @font-face in globals.css

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
        className={`${inter.variable} ${jetbrainsMono.variable} font-mono antialiased bg-dark-base text-light-text`} // Use font-mono (JetBrains) by default, apply theme base colors
      >
        <SupabaseProvider>
          <MatrixBackground />
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow container mx-auto px-6 py-12"> {/* Increased padding */}
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
