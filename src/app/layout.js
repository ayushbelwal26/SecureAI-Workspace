import './globals.css';

export const metadata = {
  title: {
    default: 'SecureAI — Enterprise AI Security Platform',
    template: '%s | SecureAI',
  },
  description: 'The invisible security layer between your team and AI. Protect sensitive data, block prompt injections, and enforce AI agent permissions automatically.',
  keywords: ['AI security', 'prompt injection', 'data loss prevention', 'enterprise AI', 'LLM security'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700;800&display=swap"
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
