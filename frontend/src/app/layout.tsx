import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import PrajaSevakWidget from '@/components/prajasevak-widget';
import { LanguageProvider } from '@/context/language-context';

export const metadata: Metadata = {
  title: 'Smart Civic Connect (SCC) | Municipal Administration & Urban Development',
  description: 'AI-Powered Municipal Grievance Redressal and Citizen Service Portal | Municipal Administration & Urban Development',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col justify-between bg-gov-lightBg">
        <LanguageProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <PrajaSevakWidget />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
