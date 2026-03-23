import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    }

    // 创建 archive
    const archive = archiver('zip', { zlib: { level: 9 } })

    // 收集 archive 数据
    const chunks: Uint8Array[] = []
    archive.on('data', (chunk) => chunks.push(chunk))

    await new Promise<void>((resolve, reject) => {
      archive.on('end', resolve)
      archive.on('error', reject)

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        try {
          // 本地文件
          if (url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), 'public', url)
            if (fs.existsSync(filePath)) {
              archive.file(filePath, { name: `avatar_${i + 1}.png` })
            }
          }
        } catch (e) {
          console.error(`Failed to add ${url}:`, e)
        }
      }

      archive.finalize()
    })

    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=q-avatar.zip',
      },
    })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
