// app/layout.tsx
import { Metadata } from 'next';
import { Inter, Rubik, Roboto_Slab } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

const rubik = Rubik({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rubik', // This creates a CSS variable that you can use in your tailwind config
});

const roboto_slab = Roboto_Slab({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto_slap', // This creates a CSS variable that you can use in your tailwind config
});

export const metadata: Metadata = {
  title: 'Creator Platform',
  description: 'A platform connecting creators and businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${rubik.variable} ${roboto_slab.variable}`}
      >
        <AuthProvider>
          <Analytics />
          <Navbar />

          <main>{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#EF4444',
                  color: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
