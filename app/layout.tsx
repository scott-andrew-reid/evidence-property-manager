import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Evidence Property Manager',
  description: 'Digital Evidence Property Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
