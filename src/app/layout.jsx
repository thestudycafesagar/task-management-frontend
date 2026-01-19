import { Toaster } from 'react-hot-toast';
import ClientProviders from '@/components/ClientProviders';
import './globals.css';

export const metadata = {
  title: 'Task Management - Organize Your Work',
  description: 'Modern task management platform for teams',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="antialiased">
        <ClientProviders>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#363636',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ClientProviders>
      </body>
    </html>
  );
}
