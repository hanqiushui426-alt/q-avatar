import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 存储上传文件的目录
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // 确保上传目录存在
    await mkdir(UPLOAD_DIR, { recursive: true })

    // 生成唯一文件名
    const fileId = uuidv4()
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${fileId}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // 写入文件
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    // 返回文件信息
    return NextResponse.json({
      file_id: fileId,
      url: `/uploads/${filename}`,
      filename,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
