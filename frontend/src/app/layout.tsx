import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Q趣头像 - AI生成专属Q版表情包',
  description: '上传照片，AI自动生成你的专属Q版表情包',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
