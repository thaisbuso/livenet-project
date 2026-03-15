import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Duckling Live MVP',
  description: 'Live + mapa em tempo real'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}