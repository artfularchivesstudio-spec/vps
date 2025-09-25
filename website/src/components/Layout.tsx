// src/components/Layout.tsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function Layout({ children, fullWidth = false }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`${fullWidth ? '' : 'container mx-auto'} flex-grow px-4 py-8`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
