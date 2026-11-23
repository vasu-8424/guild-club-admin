import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guild Club Admin Portal",
  description: "Internal store operator and fulfillment administration system for Guild Club",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans flex flex-col">
        {children}
      </body>
    </html>
  );
}
