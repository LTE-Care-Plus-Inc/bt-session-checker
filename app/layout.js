// app/layout.js
import './globals.css'; 
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner'
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BT Billing Transparency Portal',
  description: 'View your flagged payroll sessions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-100">
          {children}
        </div>
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}