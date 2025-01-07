import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '新年头像编辑器 - 为头像穿上新春的"小衣裳"',
  description: '一键为头像添加春联装饰，AI生成有趣春联，让你的头像充满新年气息！为亲朋好友送上独特的新春祝福。',
  keywords: '新年头像,头像编辑器,春联生成器,AI春联,新年头像制作,新春头像',
  authors: [{ name: 'Codeium' }],
  openGraph: {
    title: '新年头像编辑器 - 为头像穿上新春的"小衣裳"',
    description: '一键为头像添加春联装饰，AI生成有趣春联，让你的头像充满新年气息！',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
        <title>微信春联头像</title>
        <meta name="description" content="贴春联，换新颜，让头像有年味" />
        <meta name="theme-color" content="#EF4444" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-red-50 to-amber-50">{children}</body>
    </html>
  )
}
