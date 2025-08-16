import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// app/layout.tsx
export const metadata = {
  metadataBase: new URL("https://marketcap-chain.vercel.app/"),
  title: {
    default: "More-or-Less — Market Cap Chain",
    template: "%s · Market Cap Chain",
  },
  description:
    "Un mini-jeu web : devine si la prochaine société vaut plus ou moins que l'actuelle. 200+ entreprises, animation de capitalisation, scoring et partage.",
  alternates: {
    canonical: "https://marketcap-chain.vercel.app/",
  },
  openGraph: {
    type: "website",
    url: "https://marketcap-chain.vercel.app/",
    siteName: "Market Cap Chain",
    title: "More-or-Less — Market Cap Chain",
    description:
      "Devine 'More or Less' sur la market cap. Enchaîne les bonnes réponses pour battre ton highscore.",
    images: ["/og-image.png"], // fournis une image 1200x630
  },
  twitter: {
    card: "summary_large_image",
    site: "@ton_compte",
    creator: "@ton_compte",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

