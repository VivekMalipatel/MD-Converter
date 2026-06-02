import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MD Converter',
  description: 'Convert any file to Markdown — PDF, DOCX, XLSX, images, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
