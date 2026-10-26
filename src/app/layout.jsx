import './globals.css';

export const metadata = {
  title: 'BookLeaf Author Support & Communication Portal',
  description: 'AI-assisted Author Support & Communication Portal for BookLeaf Publishing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
