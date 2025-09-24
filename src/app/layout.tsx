import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/Header'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '学习笔记平台',
  description: '个人学习笔记管理和分享系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}