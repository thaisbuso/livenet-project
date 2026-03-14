import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Nautimar Live MVP',
  description: 'Live + mapa em tempo real'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}