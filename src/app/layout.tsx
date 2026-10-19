import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Eval Workbench",
  description: "Compare prompt versions and models on accuracy, latency and cost.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/" className="brand">Prompt Eval Workbench</Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
