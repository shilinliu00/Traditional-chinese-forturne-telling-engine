import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BaZi Calculator · 八字排盘',
  description: 'Four Pillars of Destiny chart calculator with astronomical solar terms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
