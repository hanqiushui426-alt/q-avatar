export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const body = await request
.json()
    const { url, urls } = body

    // 单张图片下载
    if (url && !urls
) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      const blob = await response.blob()
      
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="avatar.png"',
        },
      })
    }

    // 批量打包下载（ZIP）
    if (urls && Array.isArray(urls) && urls.length > 0) {
      const zip = new JSZip()
      
      for (let i = 0; i < urls.length; i++) {
        try {
          const response = await fetch(urls[i])
          if (response.ok) {
            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            const fileName = `avatar_${i + 1}.png`
            zip.file(fileName, arrayBuffer)
          }
        } catch (e) {
          console.error(`Failed to download image ${i}:`, e)
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      return new NextResponse(zipBlob, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="q-avatar.zip"',
        },
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
