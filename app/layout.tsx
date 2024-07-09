import { ReactNode } from 'react';
import { AI } from './actions';
import './globals.css'; // Assuming you have a global CSS file

export const metadata = {
  title: 'AI Chatbot',
  description: 'An AI-powered chatbot with image processing capabilities',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AI>{children}</AI>
      </body>
    </html>
  );
}