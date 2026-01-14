import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daily Podcast Generator - Your Personalized 5-Minute Podcast',
  description: 'Generate a personalized 5-minute daily podcast based on topics you care about. Powered by AI.',
  keywords: ['podcast', 'AI', 'personalized', 'daily', 'news', 'topics'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Background gradient mesh */}
        <div className="gradient-mesh">
          <div className="gradient-blob gradient-blob-1" />
          <div className="gradient-blob gradient-blob-2" />
          <div className="gradient-blob gradient-blob-3" />
        </div>
        {children}
      </body>
    </html>
  );
}
