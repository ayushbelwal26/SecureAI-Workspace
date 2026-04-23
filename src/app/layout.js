import './globals.css';

export const metadata = {
  title: 'SecureAI Workspace — Enterprise AI Protection',
  description:
    'SecureAI sits invisibly between your team and AI. Files stay private. Secrets stay secret. Work stays safe.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Navbar is rendered client-side inside each page via import,
            keeping this layout as a pure server component */}
        {children}
      </body>
    </html>
  );
}
