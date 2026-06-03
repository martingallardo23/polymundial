import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Polymundial — Mercados de predicción · FIFA World Cup 2026',
  description:
    'Seguí en tiempo real las probabilidades de todos los mercados de Polymarket sobre el Mundial de Fútbol 2026.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        {children}
        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-xs text-gray-400">
          <p>
            Datos provistos por{' '}
            <a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Polymarket
            </a>
            . Solo lectura — sin órdenes de compra/venta.
          </p>
        </footer>
      </body>
    </html>
  );
}
