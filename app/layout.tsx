import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'NexariOS - NumbatNET',
  description: 'Live + mapa em tempo real',
  icons: {
    icon: '/assets/favicon_numbat.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet"></link>
      </head>
      <body>{children}</body>
    </html>
  );
}