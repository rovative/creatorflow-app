import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Creator Flow',
  description: 'Schedule and publish your content to every platform from one place.',
  metadataBase: new URL('https://app.createaflow.app'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>{children}</body>
    </html>
  );
}
