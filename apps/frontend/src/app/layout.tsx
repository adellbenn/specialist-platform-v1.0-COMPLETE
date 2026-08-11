import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import '@/styles/decorative.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة إدارة أدوار الأخصائيين',
  description: 'نظام إدارة المراكز والعيادات النفسية والتربوية والتأهيلية',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = prefersDark ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                  requestAnimationFrame(function() {
                    document.documentElement.classList.add('theme-transition');
                    setTimeout(function() {
                      document.documentElement.classList.remove('theme-transition');
                    }, 300);
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased" style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
