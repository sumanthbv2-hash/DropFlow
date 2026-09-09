import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YourPad - Simple Shared Collaborative Workspace',
  description: 'A modern shared workspace for text, media, code, files, and real-time collaboration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
