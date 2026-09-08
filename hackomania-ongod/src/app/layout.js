import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://hack-o-mania-ongod.vercel.app"),
  title: {
    default: "Ongod — Find your tribe IRL",
    template: "%s · Ongod",
  },
  description:
    "Map real-world events from the communities you already belong to. Honorable mention at HackOMania 2025.",
  keywords: [
    "Ongod",
    "HackOMania",
    "Singapore events",
    "Reddit",
    "meetups",
    "Mapbox",
  ],
  authors: [{ name: "Team Ongod" }],
  openGraph: {
    title: "Ongod — Find your tribe IRL",
    description:
      "Turn Reddit communities and GitHub graphs into meetups you can actually show up to. Honorable mention at HackOMania 2025.",
    url: "https://hack-o-mania-ongod.vercel.app",
    siteName: "Ongod",
    locale: "en_SG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ongod — Find your tribe IRL",
    description:
      "Turn Reddit communities and GitHub graphs into meetups you can actually show up to.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased ${geistSans.className} ${geistMono.className}`}>
        {children}
      </body>
    </html>
  );
}
