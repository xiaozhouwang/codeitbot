import { ReactNode } from 'react';
import { AI } from './actions';

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AI>{children}</AI>
      </body>
    </html>
  );
}