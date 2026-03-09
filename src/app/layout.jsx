import './globals.css';

export const metadata = {
  title: 'Cortex Hub',
  description: 'Open-source local AI personal operating system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
