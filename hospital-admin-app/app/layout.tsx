import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'Hospital Admin',
  description: 'Hospital Queue Management Admin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans`}>
        <main className="max-w-[600px] mx-auto min-h-screen bg-[var(--bg)] shadow-sm">
          {children}
        </main>
      </body>
    </html>
  );
}
