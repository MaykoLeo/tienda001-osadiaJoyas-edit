
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import Script from 'next/script';
import { LayoutClient } from '@/components/LayoutClient';
import { Toaster } from '@/components/ui/toaster';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// El layout principal es un Componente de Servidor.
// Aquí se define la metadata global..
export const metadata: Metadata = {
  title: 'Osadía Joyas',
  description: 'Joyas contemporáneas que expresan identidad con simplicidad y elegancia.',
  icons: {
    icon: '/favicon.ico', // <-- Se declara explícitamente el favicon
    shortcut: '/favicon.ico', // <-- Se declara explícitamente el favicon
    apple: '/icon.png', // <-- Se declara explícitamente el favicon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          playfair.variable,
          inter.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <LayoutClient>{children}</LayoutClient>
          </CartProvider>
        </ThemeProvider>
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
        />
        <Toaster /> 
      </body>
    </html>
  );
}

